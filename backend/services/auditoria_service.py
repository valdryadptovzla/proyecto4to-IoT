import uuid
from datetime import datetime
from typing import Mapping

from fastapi import HTTPException

from ..database import auditoria_collection
from ..models.auditoria import AuditActor, AuditEventResponse


def build_actor(headers: Mapping[str, str], fallback_username: str = "sistema") -> AuditActor:
    username = headers.get("x-username") or fallback_username
    return AuditActor(
        user_id=headers.get("x-user-id"),
        username=username,
        rol=headers.get("x-user-role") or "anonimo",
    )


def require_admin(headers: Mapping[str, str]) -> AuditActor:
    actor = build_actor(headers)
    if actor.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo el admin puede acceder a auditoría")
    return actor


def serialize_audit_event(document: dict) -> AuditEventResponse:
    actor = document.get("actor") or {}
    return AuditEventResponse(
        id=document["_id"],
        accion=document.get("accion", "evento"),
        actor=AuditActor(
            user_id=actor.get("user_id"),
            username=actor.get("username", "sistema"),
            rol=actor.get("rol", "anonimo"),
        ),
        descripcion=document.get("descripcion", ""),
        detalles=document.get("detalles") or {},
        entidad=document.get("entidad"),
        entidad_id=document.get("entidad_id"),
        fecha=document.get("fecha", datetime.utcnow()),
    )


def log_audit_event(
    *,
    accion: str,
    actor: AuditActor,
    descripcion: str,
    detalles: dict[str, object] | None = None,
    entidad: str | None = None,
    entidad_id: str | None = None,
) -> AuditEventResponse:
    event = {
        "_id": str(uuid.uuid4()),
        "accion": accion,
        "actor": actor.model_dump(),
        "descripcion": descripcion,
        "detalles": detalles or {},
        "entidad": entidad,
        "entidad_id": entidad_id,
        "fecha": datetime.utcnow(),
    }
    auditoria_collection.insert_one(event)
    return serialize_audit_event(event)