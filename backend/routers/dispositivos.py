import uuid

from fastapi import APIRouter, HTTPException, Request

from ..database import alertas_collection, consumo_collection, dispositivos_collection
from ..models.dispositivo import DispositivoCreate, DispositivoResponse, DispositivoUpdate
from ..services.auditoria_service import log_audit_event
from ..services.auth_service import get_current_actor, require_admin_request


router = APIRouter(prefix="/dispositivos", tags=["Dispositivos"])


def serialize_dispositivo(document: dict) -> DispositivoResponse:
    return DispositivoResponse(
        id=str(document["_id"]),
        nombre=document["nombre"],
        tipo=document["tipo"],
        ubicacion=document["ubicacion"],
        estado=document["estado"],
    )


@router.post("", response_model=DispositivoResponse, status_code=201)
def crear_dispositivo(payload: DispositivoCreate, request: Request) -> DispositivoResponse:
    actor = require_admin_request(request)
    dispositivo = payload.model_dump()
    dispositivo["_id"] = str(uuid.uuid4())
    dispositivos_collection.insert_one(dispositivo)
    log_audit_event(
        accion="dispositivo_creado",
        actor=actor,
        descripcion=f"Se creo el dispositivo {dispositivo['nombre']}",
        detalles={"estado": dispositivo["estado"], "ubicacion": dispositivo["ubicacion"]},
        entidad="dispositivo",
        entidad_id=dispositivo["_id"],
    )
    return serialize_dispositivo(dispositivo)


@router.get("", response_model=list[DispositivoResponse])
def obtener_dispositivos(request: Request) -> list[DispositivoResponse]:
    get_current_actor(request)
    dispositivos = dispositivos_collection.find().sort("nombre", 1)
    return [serialize_dispositivo(item) for item in dispositivos]


@router.get("/{dispositivo_id}", response_model=DispositivoResponse)
def obtener_dispositivo(dispositivo_id: str, request: Request) -> DispositivoResponse:
    get_current_actor(request)
    dispositivo = dispositivos_collection.find_one({"_id": dispositivo_id})
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    return serialize_dispositivo(dispositivo)


@router.put("/{dispositivo_id}", response_model=DispositivoResponse)
def actualizar_dispositivo(
    dispositivo_id: str, payload: DispositivoUpdate, request: Request
) -> DispositivoResponse:
    actor = require_admin_request(request)
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    result = dispositivos_collection.update_one(
        {"_id": dispositivo_id},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    dispositivo_actualizado = dispositivos_collection.find_one({"_id": dispositivo_id})
    log_audit_event(
        accion="dispositivo_actualizado",
        actor=actor,
        descripcion=f"Se actualizo el dispositivo {dispositivo_actualizado['nombre']}",
        detalles=update_data,
        entidad="dispositivo",
        entidad_id=dispositivo_id,
    )
    return serialize_dispositivo(dispositivo_actualizado)


@router.delete("/{dispositivo_id}")
def eliminar_dispositivo(dispositivo_id: str, request: Request) -> dict[str, object]:
    actor = require_admin_request(request)
    dispositivo = dispositivos_collection.find_one({"_id": dispositivo_id})
    result = dispositivos_collection.delete_one({"_id": dispositivo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    consumos_eliminados = consumo_collection.delete_many({"dispositivo_id": dispositivo_id}).deleted_count
    alertas_eliminadas = alertas_collection.delete_many({"dispositivo_id": dispositivo_id}).deleted_count

    log_audit_event(
        accion="dispositivo_eliminado",
        actor=actor,
        descripcion=f"Se elimino el dispositivo {dispositivo.get('nombre', dispositivo_id) if dispositivo else dispositivo_id}",
        detalles={
            "consumos_eliminados": consumos_eliminados,
            "alertas_eliminadas": alertas_eliminadas,
        },
        entidad="dispositivo",
        entidad_id=dispositivo_id,
    )

    return {
        "message": "Dispositivo eliminado",
        "dispositivo_id": dispositivo_id,
        "consumos_eliminados": consumos_eliminados,
        "alertas_eliminadas": alertas_eliminadas,
    }
