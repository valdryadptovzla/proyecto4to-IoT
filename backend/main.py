import hashlib
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import usuarios_collection
from models.usuario import LoginRequest
from routers.alertas import router as alertas_router
from routers.consumo import router as consumo_router
from routers.dispositivos import router as dispositivos_router


app = FastAPI(
    title="Sistema de Gestion Energetica",
    description="API para monitoreo y optimizacion del consumo electrico en oficinas.",
    version="1.0.0",
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def ensure_default_user() -> None:
    if usuarios_collection.count_documents({}) > 0:
        return

    usuarios_collection.insert_one(
        {
            "_id": "admin",
            "username": "admin",
            "password_hash": hash_password("admin123"),
            "nombre_completo": "Administrador del Sistema",
            "rol": "admin",
        }
    )


@app.on_event("startup")
def on_startup() -> None:
    ensure_default_user()


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "API de gestion energetica operativa"}


@app.post("/login")
def login(payload: LoginRequest) -> dict[str, object]:
    user = usuarios_collection.find_one({"username": payload.username})
    if not user or user.get("password_hash") != hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Credenciales invalidas")

    return {
        "message": "Login exitoso",
        "usuario": {
            "id": user["_id"],
            "username": user["username"],
            "nombre_completo": user.get("nombre_completo"),
            "rol": user.get("rol", "operador"),
        },
    }


app.include_router(dispositivos_router)
app.include_router(consumo_router)
app.include_router(alertas_router)