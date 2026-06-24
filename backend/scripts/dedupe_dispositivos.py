#!/usr/bin/env python3
"""Eliminar duplicados en la colección `dispositivos`.

Regla: mantener la entrada más antigua por combinación (nombre, ubicacion),
eliminar el resto. Imprime los _id de los documentos eliminados y un resumen.
"""
from __future__ import annotations

import os
from pymongo import MongoClient


MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "gestion_energetica")


def main():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    col = db['dispositivos']

    print('Leyendo dispositivos...')
    docs = list(col.find({}, projection={'_id': 1, 'nombre': 1, 'ubicacion': 1}))
    pairs = {}
    to_delete = []

    for d in docs:
        key = (d.get('nombre'), d.get('ubicacion'))
        if key in pairs:
            to_delete.append(d['_id'])
        else:
            pairs[key] = d['_id']

    if not to_delete:
        print('No se encontraron duplicados.')
        return

    print(f'Encontrados {len(to_delete)} duplicados. Eliminando...')
    res = col.delete_many({'_id': {'$in': to_delete}})
    print('Eliminados:', res.deleted_count)
    print('IDs eliminados:')
    for _id in to_delete:
        print('-', _id)


if __name__ == '__main__':
    main()
