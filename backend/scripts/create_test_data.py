#!/usr/bin/env python3
import json
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime


BASE = "http://localhost:8000"

HEADERS_ADMIN = {
    "x-user-id": "admin",
    "x-username": "admin",
    "x-user-role": "admin",
    "Content-Type": "application/json",
}

USERS = [
    {
        "username": "admin2",
        "password": "Admin2Pass123",
        "nombre_completo": "Admin Segundo",
        "rol": "admin",
    },
    {
        "username": "usuario2",
        "password": "User2Pass123",
        "nombre_completo": "Usuario Normal",
        "rol": "usuario",
    },
]

DEVICES = [
    {"nombre": "Medidor-A", "tipo": "medidor", "ubicacion": "Sala A", "estado": "encendido"},
    {"nombre": "Medidor-B", "tipo": "medidor", "ubicacion": "Sala B", "estado": "apagado"},
    {"nombre": "Sensor-C", "tipo": "sensor", "ubicacion": "Pasillo", "estado": "apagado"},
]


def post(path: str, body: dict, headers: dict | None = None):
    url = BASE + path
    data = json.dumps(body).encode("utf-8")
    hdrs = headers.copy() if headers else {}
    hdrs.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, headers=hdrs, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp_body = resp.read().decode("utf-8")
            try:
                return resp.getcode(), json.loads(resp_body)
            except json.JSONDecodeError:
                return resp.getcode(), resp_body
    except urllib.error.HTTPError as error:
        try:
            return error.code, error.read().decode("utf-8")
        except Exception:
            return error.code, str(error)
    except Exception as error:
        return None, str(error)


def get(path: str, headers: dict | None = None):
    url = BASE + path
    req = urllib.request.Request(url, headers=headers.copy() if headers else {}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp_body = resp.read().decode("utf-8")
            try:
                return resp.getcode(), json.loads(resp_body)
            except json.JSONDecodeError:
                return resp.getcode(), resp_body
    except urllib.error.HTTPError as error:
        try:
            return error.code, error.read().decode("utf-8")
        except Exception:
            return error.code, str(error)
    except Exception as error:
        return None, str(error)


def insert_user_directly(user: dict) -> None:
    from backend.database import usuarios_collection
    from backend.services.password_service import hash_password

    usuario = {
        "_id": str(uuid.uuid4()),
        "username": user["username"],
        "email": user.get("email", f"{user['username']}@example.local"),
        "password_hash": hash_password(user["password"]),
        "nombre_completo": user["nombre_completo"],
        "rol": user.get("rol", "usuario"),
        "fecha_creacion": datetime.utcnow(),
    }
    usuarios_collection.insert_one(usuario)


def main() -> None:
    print("Creando usuarios...")
    for user in USERS:
        code, response = post("/usuarios", user, HEADERS_ADMIN)
        print("POST /usuarios", user["username"], "=>", code, response)

        if code is None or (isinstance(code, int) and code >= 400):
            try:
                print("Intentando insercion directa en BD para", user["username"])
                insert_user_directly(user)
                print("Insercion directa OK para", user["username"])
            except Exception as error:
                print("Error insercion directa:", error)
        time.sleep(0.3)

    print("\nCreando dispositivos...")
    for device in DEVICES:
        code, response = post("/dispositivos", device, HEADERS_ADMIN)
        print("POST /dispositivos", device["nombre"], "=>", code, response)
        time.sleep(0.3)

    print("\nListando usuarios y dispositivos desde la API...")
    code, users = get("/usuarios", HEADERS_ADMIN)
    print("GET /usuarios =>", code, users)
    code, devices = get("/dispositivos", HEADERS_ADMIN)
    print("GET /dispositivos =>", code, devices)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(1)
