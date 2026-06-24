from datetime import datetime
import uuid

from fastapi import APIRouter, HTTPException, Request

from ..database import alertas_collection
from ..models.alerta import AlertaCreate, AlertaResponse, AlertaUpdate
from ..services.auth_service import get_current_actor, require_admin_request


router = APIRouter(prefix="/alertas", tags=["Alertas"])


TIPO_ALERTA_NIVEL = {
    "alto_consumo": "critica",
    "bajo_consumo": "info",
    "consumo_normal": "info",
}


def get_document_id(document: dict) -> str:
    return str(document["_id"])


def get_fecha(document: dict) -> datetime | None:
    fecha_val = document.get("fecha") or document.get("fecha_registro")
    if isinstance(fecha_val, str):
        return datetime.fromisoformat(fecha_val.replace("Z", "+00:00"))
    return fecha_val


def get_nivel(document: dict) -> str:
    if document.get("nivel"):
        return document["nivel"]
    return TIPO_ALERTA_NIVEL.get(document.get("tipo_alerta", ""), "advertencia")


def serialize_alerta(document: dict) -> AlertaResponse:
    return AlertaResponse(
        id=get_document_id(document),
        dispositivo_id=document.get("dispositivo_id", ""),
        mensaje=document.get("mensaje", ""),
        nivel=get_nivel(document),
        fecha=get_fecha(document),
    )


@router.post("", response_model=AlertaResponse, status_code=201)
def crear_alerta(payload: AlertaCreate, request: Request) -> AlertaResponse:
    require_admin_request(request)
    alerta = payload.model_dump()
    alerta["_id"] = str(uuid.uuid4())
    alerta["fecha_registro"] = datetime.utcnow()
    alertas_collection.insert_one(alerta)
    return serialize_alerta(alerta)


@router.get("", response_model=list[AlertaResponse])
def obtener_alertas(request: Request) -> list[AlertaResponse]:
    get_current_actor(request)
    alertas = alertas_collection.find().sort("fecha_registro", -1)
    return [serialize_alerta(item) for item in alertas]


@router.get("/{alerta_id}", response_model=AlertaResponse)
def obtener_alerta(alerta_id: str, request: Request) -> AlertaResponse:
    get_current_actor(request)
    alerta = alertas_collection.find_one({"_id": alerta_id})
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    return serialize_alerta(alerta)


@router.put("/{alerta_id}", response_model=AlertaResponse)
def actualizar_alerta(alerta_id: str, payload: AlertaUpdate, request: Request) -> AlertaResponse:
    require_admin_request(request)
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    result = alertas_collection.update_one(
        {"_id": alerta_id},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    alerta_actualizada = alertas_collection.find_one({"_id": alerta_id})
    return serialize_alerta(alerta_actualizada)


@router.delete("/{alerta_id}")
def eliminar_alerta(alerta_id: str, request: Request) -> dict[str, str]:
    require_admin_request(request)
    result = alertas_collection.delete_one({"_id": alerta_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    return {
        "message": "Alerta eliminada",
        "alerta_id": alerta_id,
    }
