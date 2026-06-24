import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import usuarios_collection
from pymongo.errors import DuplicateKeyError
from .routers.alertas import router as alertas_router
from .routers.auditoria import router as auditoria_router
from .routers.consumo import router as consumo_router
from .routers.dispositivos import router as dispositivos_router
from .routers.usuarios import router as usuarios_router
from .services.password_service import hash_password


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


def ensure_default_user() -> None:
    default_users = [
        {
            "_id": "admin",
            "username": "admin",
            "password_hash": hash_password("admin"),
            "nombre_completo": "Administrador del Sistema",
            "rol": "admin",
        },
        {
            "_id": "usuario-demo",
            "username": "usuario",
            "password_hash": hash_password("usuario123"),
            "nombre_completo": "Usuario Operativo",
            "rol": "usuario",
        },
    ]

    for default_user in default_users:
        if usuarios_collection.find_one({"_id": default_user["_id"]}):
            continue
        try:
            usuarios_collection.insert_one(default_user)
        except DuplicateKeyError:
            # Ignore if unique index (e.g. on email) prevents insertion
            continue


@app.on_event("startup")
def on_startup() -> None:
    ensure_default_user()


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "API de gestion energetica operativa"}


app.include_router(usuarios_router)
app.include_router(dispositivos_router)
app.include_router(consumo_router)
app.include_router(alertas_router)
app.include_router(auditoria_router)
