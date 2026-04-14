import os

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database


MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("MONGO_DB_NAME", "gestion_energetica")

client = MongoClient(MONGO_URL)
db: Database = client[DATABASE_NAME]


def get_collection(name: str) -> Collection:
    return db[name]


dispositivos_collection = get_collection("dispositivos")
consumo_collection = get_collection("consumo_energia")
alertas_collection = get_collection("alertas")
usuarios_collection = get_collection("usuarios")