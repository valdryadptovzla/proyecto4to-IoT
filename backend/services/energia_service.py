import os
import uuid
from datetime import datetime

from models.consumo import ConsumoCreate


ALERT_THRESHOLD_WATTS = float(os.getenv("ALERT_THRESHOLD_WATTS", "1000"))


def build_consumo_document(payload: ConsumoCreate) -> dict:
    return {
        "_id": str(uuid.uuid4()),
        "dispositivo_id": payload.dispositivo_id,
        "consumo_watts": payload.consumo_watts,
        "fecha_registro": datetime.utcnow(),
    }


def generar_alertas_desde_consumo(consumo_document: dict, dispositivo: dict) -> list[dict]:
    alertas: list[dict] = []
    consumo_watts = consumo_document["consumo_watts"]
    dispositivo_id = consumo_document["dispositivo_id"]
    fecha_registro = consumo_document["fecha_registro"]

    if consumo_watts >= ALERT_THRESHOLD_WATTS:
        alertas.append(
            {
                "_id": str(uuid.uuid4()),
                "dispositivo_id": dispositivo_id,
                "mensaje": (
                    f"El dispositivo '{dispositivo['nombre']}' supero el umbral de "
                    f"{ALERT_THRESHOLD_WATTS}W con un consumo de {consumo_watts}W"
                ),
                "nivel": "critica",
                "fecha_registro": fecha_registro,
            }
        )

    if dispositivo.get("estado") == "apagado" and consumo_watts > 0:
        alertas.append(
            {
                "_id": str(uuid.uuid4()),
                "dispositivo_id": dispositivo_id,
                "mensaje": (
                    f"Se detecto consumo en el dispositivo '{dispositivo['nombre']}' "
                    "aunque aparece apagado"
                ),
                "nivel": "advertencia",
                "fecha_registro": fecha_registro,
            }
        )

    return alertas