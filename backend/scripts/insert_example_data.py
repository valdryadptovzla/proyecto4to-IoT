#!/usr/bin/env python3
"""Insertar ejemplos persistentes en alertas y consumo_energia.

Usar desde la raiz del proyecto:
python -m backend.scripts.insert_example_data
"""

from datetime import datetime

from pymongo.errors import DuplicateKeyError

from ..database import alertas_collection, consumo_collection


def main() -> None:
    now = datetime.utcnow()

    alerta = {
        "_id": "ejemplo-1",
        "dispositivo_id": "demo-device",
        "mensaje": "Consumo anomalo detectado: pico en las ultimas 24h",
        "nivel": "critica",
        "fecha_registro": now,
    }

    consumo = {
        "_id": "ejemplo-1",
        "dispositivo_id": "demo-device",
        "consumo_watts": 123.4,
        "fecha_registro": now,
    }

    pairs = [(alertas_collection, alerta), (consumo_collection, consumo)]
    for collection, document in pairs:
        try:
            collection.replace_one({"_id": document["_id"]}, document, upsert=True)
            print(f'OK: Insertado/actualizado en "{collection.name}": {document["_id"]}')
        except DuplicateKeyError as error:
            print("Aviso: clave duplicada", error)
        except Exception as error:
            print("Error al insertar en", collection.name, error)


if __name__ == "__main__":
    main()
