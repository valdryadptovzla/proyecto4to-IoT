import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .database import usuarios_collection
from pymongo.errors import DuplicateKeyError
from .routers.alertas import router as alertas_router
from .routers.auditoria import router as auditoria_router
from .routers.consumo import router as consumo_router
from .routers.dispositivos import router as dispositivos_router
from .routers.usuarios import router as usuarios_router
from .services.password_service import hash_password


# ---------------------------------------------------------------------------
# Rate Limiter – shared instance used by routers via app.state.limiter
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])


app = FastAPI(
    title="Sistema de Gestion Energetica",
    description="API para monitoreo y optimizacion del consumo electrico en oficinas.",
    version="1.0.0",
)

# Attach limiter to app so routers can access it via request.app.state.limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS – only allow known origins (configurable via .env)
# ---------------------------------------------------------------------------
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8081").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Default users — created on first startup if they don't exist yet.
# Credentials:
#   Admin:   energiadmin / Energia@2026!
#   Usuario: operador    / Monitor#IoT24
# ---------------------------------------------------------------------------
def ensure_default_user() -> None:
    default_users = [
        {
            "_id": "admin",
            "username": "energiadmin",
            "password_hash": hash_password("Energia@2026!"),
            "nombre_completo": "Administrador del Sistema",
            "rol": "admin",
        },
        {
            "_id": "usuario-demo",
            "username": "operador",
            "password_hash": hash_password("Monitor#IoT24"),
            "nombre_completo": "Operador de Monitoreo",
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
