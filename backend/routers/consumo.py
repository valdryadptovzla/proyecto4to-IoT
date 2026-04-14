from fastapi import APIRouter, HTTPException

from database import alertas_collection, consumo_collection, dispositivos_collection
from models.consumo import ConsumoCreate, ConsumoResponse
from services.energia_service import build_consumo_document, generar_alertas_desde_consumo


router = APIRouter(prefix="/consumo", tags=["Consumo"])


def serialize_consumo(document: dict) -> ConsumoResponse:
    return ConsumoResponse(
        id=document["_id"],
        dispositivo_id=document["dispositivo_id"],
        consumo_watts=document["consumo_watts"],
        fecha_registro=document["fecha_registro"],
    )


@router.post("", response_model=ConsumoResponse, status_code=201)
def registrar_consumo(payload: ConsumoCreate) -> ConsumoResponse:
    dispositivo = dispositivos_collection.find_one({"_id": payload.dispositivo_id})
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    consumo_document = build_consumo_document(payload)
    consumo_collection.insert_one(consumo_document)

    alertas = generar_alertas_desde_consumo(consumo_document, dispositivo)
    if alertas:
        alertas_collection.insert_many(alertas)

    return serialize_consumo(consumo_document)


@router.get("", response_model=list[ConsumoResponse])
def obtener_consumos() -> list[ConsumoResponse]:
    consumos = consumo_collection.find().sort("fecha_registro", -1)
    return [serialize_consumo(item) for item in consumos]


@router.get("/{dispositivo_id}", response_model=list[ConsumoResponse])
def obtener_consumo_por_dispositivo(dispositivo_id: str) -> list[ConsumoResponse]:
    dispositivo = dispositivos_collection.find_one({"_id": dispositivo_id})
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    consumos = consumo_collection.find({"dispositivo_id": dispositivo_id}).sort(
        "fecha_registro", -1
    )
    return [serialize_consumo(item) for item in consumos]


@router.delete("/{consumo_id}")
def eliminar_consumo(consumo_id: str) -> dict[str, str]:
    result = consumo_collection.delete_one({"_id": consumo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registro de consumo no encontrado")

    return {
        "message": "Registro de consumo eliminado",
        "consumo_id": consumo_id,
    }