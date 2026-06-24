from datetime import datetime
from fastapi import APIRouter, HTTPException, Request

from ..database import alertas_collection, consumo_collection, dispositivos_collection
from ..models.consumo import ConsumoCreate, ConsumoResponse, ConsumoUpdate
from ..services.auth_service import get_current_actor, require_admin_request
from ..services.energia_service import build_consumo_document, generar_alertas_desde_consumo


router = APIRouter(prefix="/consumo", tags=["Consumo"])


def get_document_id(document: dict) -> str:
    return str(document["_id"])


def get_fecha(document: dict) -> datetime | None:
    fecha_val = document.get("fecha") or document.get("fecha_registro")
    if isinstance(fecha_val, str):
        return datetime.fromisoformat(fecha_val.replace("Z", "+00:00"))
    return fecha_val


def serialize_consumo(document: dict) -> ConsumoResponse:
    return ConsumoResponse(
        id=get_document_id(document),
        dispositivo_id=document.get("dispositivo_id", ""),
        consumo_watts=document.get("consumo_watts", 0),
        fecha=get_fecha(document),
    )


@router.post("", response_model=ConsumoResponse, status_code=201)
def registrar_consumo(payload: ConsumoCreate, request: Request) -> ConsumoResponse:
    require_admin_request(request)
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
def obtener_consumos(request: Request) -> list[ConsumoResponse]:
    get_current_actor(request)
    consumos = consumo_collection.find().sort("fecha_registro", -1)
    return [serialize_consumo(item) for item in consumos]


@router.get("/{dispositivo_id}", response_model=list[ConsumoResponse])
def obtener_consumo_por_dispositivo(dispositivo_id: str, request: Request) -> list[ConsumoResponse]:
    get_current_actor(request)
    dispositivo = dispositivos_collection.find_one({"_id": dispositivo_id})
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    consumos = consumo_collection.find({"dispositivo_id": dispositivo_id}).sort(
        "fecha_registro", -1
    )
    return [serialize_consumo(item) for item in consumos]


@router.put("/{consumo_id}", response_model=ConsumoResponse)
def actualizar_consumo(
    consumo_id: str, payload: ConsumoUpdate, request: Request
) -> ConsumoResponse:
    require_admin_request(request)
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=400, detail="No hay datos para actualizar"
        )

    result = consumo_collection.update_one(
        {"_id": consumo_id},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registro de consumo no encontrado")

    consumo_actualizado = consumo_collection.find_one({"_id": consumo_id})
    return serialize_consumo(consumo_actualizado)


@router.delete("/{consumo_id}")
def eliminar_consumo(consumo_id: str, request: Request) -> dict[str, str]:
    require_admin_request(request)
    result = consumo_collection.delete_one({"_id": consumo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registro de consumo no encontrado")

    return {
        "message": "Registro de consumo eliminado",
        "consumo_id": consumo_id,
    }
