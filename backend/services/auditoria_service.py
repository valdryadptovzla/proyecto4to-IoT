import uuid
from datetime import datetime

from ..database import auditoria_collection
from ..models.auditoria import AuditActor, AuditEventResponse



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