from datetime import datetime
import uuid

from fastapi import APIRouter, HTTPException

from database import alertas_collection
from models.alerta import AlertaCreate, AlertaResponse


router = APIRouter(prefix="/alertas", tags=["Alertas"])


def serialize_alerta(document: dict) -> AlertaResponse:
    return AlertaResponse(
        id=document["_id"],
        dispositivo_id=document["dispositivo_id"],
        mensaje=document["mensaje"],
        nivel=document["nivel"],
        fecha_registro=document["fecha_registro"],
    )


@router.post("", response_model=AlertaResponse, status_code=201)
def crear_alerta(payload: AlertaCreate) -> AlertaResponse:
    alerta = payload.model_dump()
    alerta["_id"] = str(uuid.uuid4())
    alerta["fecha_registro"] = datetime.utcnow()
    alertas_collection.insert_one(alerta)
    return serialize_alerta(alerta)


@router.get("", response_model=list[AlertaResponse])
def obtener_alertas() -> list[AlertaResponse]:
    alertas = alertas_collection.find().sort("fecha_registro", -1)
    return [serialize_alerta(item) for item in alertas]


@router.delete("/{alerta_id}")
def eliminar_alerta(alerta_id: str) -> dict[str, str]:
    result = alertas_collection.delete_one({"_id": alerta_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    return {
        "message": "Alerta eliminada",
        "alerta_id": alerta_id,
    }