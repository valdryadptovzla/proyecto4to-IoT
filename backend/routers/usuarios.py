import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Request
from pymongo.errors import DuplicateKeyError

from ..database import usuarios_collection
from ..models.usuario import (
    LoginRequest,
    UsuarioCreate,
    UsuarioResponse,
    UsuarioUpdate,
)
from ..services.auditoria_service import AuditActor, log_audit_event
from ..services.auth_service import create_access_token, require_admin_request
from ..services.password_service import hash_password, needs_rehash, verify_password


router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


def serialize_usuario(document: dict) -> UsuarioResponse:
    role = document.get("rol", "usuario")
    if role not in {"admin", "usuario"}:
        role = "usuario"
    return UsuarioResponse(
        id=str(document["_id"]),
        username=document.get("username") or document.get("usuario", ""),
        nombre_completo=document.get("nombre_completo") or document.get("nombre", ""),
        rol=role,
        fecha_creacion=document.get("fecha_creacion"),
    )


def build_user_actor(user: dict, fallback_username: str) -> AuditActor:
    role = user.get("rol", "usuario")
    if role not in {"admin", "usuario"}:
        role = "usuario"
    return AuditActor(
        user_id=str(user.get("_id")),
        username=user.get("username") or user.get("usuario", fallback_username),
        rol=role,
    )


def reject_login(user: dict, username: str) -> None:
    log_audit_event(
        accion="login_fallido",
        actor=build_user_actor(user, username),
        descripcion="Intento de acceso con contraseña inválida",
        detalles={"username": username},
        entidad="usuario",
        entidad_id=str(user.get("_id")),
    )
    raise HTTPException(status_code=401, detail="Credenciales inválidas")


@router.post("", response_model=UsuarioResponse, status_code=201)
def crear_usuario(payload: UsuarioCreate, request: Request) -> UsuarioResponse:
    actor = require_admin_request(request)
    if usuarios_collection.find_one(
        {"$or": [{"username": payload.username}, {"usuario": payload.username}]}
    ):
        raise HTTPException(status_code=400, detail="El username ya existe")

    usuario = {
        "_id": str(uuid.uuid4()),
        "username": payload.username,
        "email": f"{payload.username}@example.local",
        "password_hash": hash_password(payload.password),
        "nombre_completo": payload.nombre_completo,
        "rol": payload.rol,
        "fecha_creacion": datetime.utcnow(),
    }
    try:
        usuarios_collection.insert_one(usuario)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=400,
            detail="Clave única violada al crear usuario: posible email/username duplicado",
        )

    log_audit_event(
        accion="usuario_creado",
        actor=actor,
        descripcion=f"Se creó el usuario {payload.username}",
        detalles={"rol": payload.rol},
        entidad="usuario",
        entidad_id=usuario["_id"],
    )
    return serialize_usuario(usuario)


@router.get("", response_model=list[UsuarioResponse])
def obtener_usuarios(request: Request) -> list[UsuarioResponse]:
    require_admin_request(request)
    usuarios = usuarios_collection.find().sort("username", 1)
    return [serialize_usuario(item) for item in usuarios]


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(usuario_id: str, request: Request) -> UsuarioResponse:
    require_admin_request(request)
    usuario = usuarios_collection.find_one({"_id": usuario_id})
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return serialize_usuario(usuario)


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(
    usuario_id: str, payload: UsuarioUpdate, request: Request
) -> UsuarioResponse:
    actor = require_admin_request(request)
    update_data = payload.model_dump(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    result = usuarios_collection.update_one(
        {"_id": usuario_id},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario_actualizado = usuarios_collection.find_one({"_id": usuario_id})
    log_audit_event(
        accion="usuario_actualizado",
        actor=actor,
        descripcion=f"Se actualizó el usuario {usuario_actualizado.get('username', usuario_id)}",
        detalles={key: value for key, value in update_data.items() if key != "password_hash"},
        entidad="usuario",
        entidad_id=usuario_id,
    )
    return serialize_usuario(usuario_actualizado)


@router.delete("/{usuario_id}")
def eliminar_usuario(usuario_id: str, request: Request) -> dict[str, str]:
    actor = require_admin_request(request)
    if usuario_id == "admin":
        raise HTTPException(status_code=403, detail="No se puede eliminar el usuario admin")

    usuario = usuarios_collection.find_one({"_id": usuario_id})
    result = usuarios_collection.delete_one({"_id": usuario_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    log_audit_event(
        accion="usuario_eliminado",
        actor=actor,
        descripcion=f"Se eliminó el usuario {usuario.get('username', usuario_id) if usuario else usuario_id}",
        detalles={"usuario_id": usuario_id},
        entidad="usuario",
        entidad_id=usuario_id,
    )

    return {
        "message": "Usuario eliminado",
        "usuario_id": usuario_id,
    }


@router.post("/login")
def login(payload: LoginRequest) -> dict[str, object]:
    user = usuarios_collection.find_one(
        {"$or": [{"username": payload.username}, {"usuario": payload.username}]}
    )
    if not user:
        log_audit_event(
            accion="login_fallido",
            actor=AuditActor(username=payload.username, rol="anonimo"),
            descripcion="Intento de acceso con usuario inexistente",
            detalles={"username": payload.username},
            entidad="usuario",
        )
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    stored_hash = user.get("password_hash")
    legacy_plaintext_matches = user.get("password") == payload.password

    if not verify_password(payload.password, stored_hash) and not legacy_plaintext_matches:
        reject_login(user, payload.username)

    if legacy_plaintext_matches or needs_rehash(stored_hash):
        usuarios_collection.update_one(
            {"_id": user.get("_id")},
            {
                "$set": {"password_hash": hash_password(payload.password)},
                "$unset": {"password": ""},
            },
        )

    log_audit_event(
        accion="login_exitoso",
        actor=build_user_actor(user, payload.username),
        descripcion="Inicio de sesión exitoso",
        detalles={"username": payload.username},
        entidad="usuario",
        entidad_id=str(user.get("_id")),
    )

    return {
        "message": "Login exitoso",
        "token": create_access_token(user),
        "usuario": {
            "id": str(user["_id"]),
            "username": user.get("username") or user.get("usuario", ""),
            "nombre_completo": user.get("nombre_completo") or user.get("nombre", ""),
            "rol": serialize_usuario(user).rol,
        },
    }
