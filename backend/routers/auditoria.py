from fastapi import APIRouter, Query, Request

from ..database import auditoria_collection
from ..models.auditoria import AuditEventCreate, AuditEventResponse
from ..services.auditoria_service import (
    log_audit_event,
    serialize_audit_event,
)
from ..services.auth_service import require_admin_request


router = APIRouter(prefix="/auditoria", tags=["Auditoría"])


@router.get("", response_model=list[AuditEventResponse])
def obtener_eventos_auditoria(
    request: Request,
    accion: str | None = Query(default=None),
    username: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[AuditEventResponse]:
    require_admin_request(request)

    query: dict[str, object] = {}
    if accion:
        query["accion"] = accion
    if username:
        query["actor.username"] = username

    eventos = auditoria_collection.find(query).sort("fecha", -1).limit(limit)
    return [serialize_audit_event(evento) for evento in eventos]


@router.post("/eventos", response_model=AuditEventResponse, status_code=201)
def crear_evento_auditoria(
    payload: AuditEventCreate,
    request: Request,
) -> AuditEventResponse:
    actor = require_admin_request(request)
    return log_audit_event(
        accion=payload.accion,
        actor=actor,
        descripcion=payload.descripcion,
        detalles=payload.detalles,
        entidad=payload.entidad,
        entidad_id=payload.entidad_id,
    )
