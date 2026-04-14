import uuid

from fastapi import APIRouter, HTTPException

from database import alertas_collection, consumo_collection, dispositivos_collection
from models.dispositivo import DispositivoCreate, DispositivoResponse, DispositivoUpdate


router = APIRouter(prefix="/dispositivos", tags=["Dispositivos"])


def serialize_dispositivo(document: dict) -> DispositivoResponse:
    return DispositivoResponse(
        id=document["_id"],
        nombre=document["nombre"],
        tipo=document["tipo"],
        ubicacion=document["ubicacion"],
        estado=document["estado"],
    )


@router.post("", response_model=DispositivoResponse, status_code=201)
def crear_dispositivo(payload: DispositivoCreate) -> DispositivoResponse:
    dispositivo = payload.model_dump()
    dispositivo["_id"] = str(uuid.uuid4())
    dispositivos_collection.insert_one(dispositivo)
    return serialize_dispositivo(dispositivo)


@router.get("", response_model=list[DispositivoResponse])
def obtener_dispositivos() -> list[DispositivoResponse]:
    dispositivos = dispositivos_collection.find().sort("nombre", 1)
    return [serialize_dispositivo(item) for item in dispositivos]


@router.get("/{dispositivo_id}", response_model=DispositivoResponse)
def obtener_dispositivo(dispositivo_id: str) -> DispositivoResponse:
    dispositivo = dispositivos_collection.find_one({"_id": dispositivo_id})
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    return serialize_dispositivo(dispositivo)


@router.put("/{dispositivo_id}", response_model=DispositivoResponse)
def actualizar_dispositivo(
    dispositivo_id: str, payload: DispositivoUpdate
) -> DispositivoResponse:
    result = dispositivos_collection.update_one(
        {"_id": dispositivo_id},
        {"$set": payload.model_dump()},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    dispositivo_actualizado = dispositivos_collection.find_one({"_id": dispositivo_id})
    return serialize_dispositivo(dispositivo_actualizado)


@router.delete("/{dispositivo_id}")
def eliminar_dispositivo(dispositivo_id: str) -> dict[str, object]:
    result = dispositivos_collection.delete_one({"_id": dispositivo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    consumos_eliminados = consumo_collection.delete_many(
        {"dispositivo_id": dispositivo_id}
    ).deleted_count
    alertas_eliminadas = alertas_collection.delete_many(
        {"dispositivo_id": dispositivo_id}
    ).deleted_count

    return {
        "message": "Dispositivo eliminado",
        "dispositivo_id": dispositivo_id,
        "consumos_eliminados": consumos_eliminados,
        "alertas_eliminadas": alertas_eliminadas,
    }