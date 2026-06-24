import os
import time
from typing import Any

import jwt
from fastapi import HTTPException, Request

from ..database import usuarios_collection
from ..models.auditoria import AuditActor


TOKEN_SECRET = os.getenv("TOKEN_SECRET", "dev-secret-change-me")
TOKEN_TTL_SECONDS = int(os.getenv("TOKEN_TTL_SECONDS", str(60 * 60 * 8)))
JWT_ALGORITHM = "HS256"


def create_access_token(user: dict[str, Any]) -> str:
    """Create a JWT access token for the given user document."""
    role = user.get("rol", "usuario")
    if role not in {"admin", "usuario"}:
        role = "usuario"
    payload = {
        "sub": str(user["_id"]),
        "username": user.get("username") or user.get("usuario", ""),
        "rol": role,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    return jwt.encode(payload, TOKEN_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, TOKEN_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesion expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")

    return payload


def get_token_from_request(request: Request) -> str | None:
    """Extract a Bearer token from the Authorization header."""
    authorization = request.headers.get("authorization", "")
    if authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


def get_current_actor(request: Request) -> AuditActor:
    """Authenticate the request via JWT and return the actor.

    This function no longer falls back to insecure x-user-role / x-username
    headers.  Every request must carry a valid Bearer token.
    """
    token = get_token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="Sesion requerida")

    payload = decode_access_token(token)
    user = usuarios_collection.find_one({"_id": payload.get("sub")})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    role = user.get("rol", payload.get("rol", "usuario"))
    if role not in {"admin", "usuario"}:
        role = "usuario"

    return AuditActor(
        user_id=str(user["_id"]),
        username=user.get("username") or user.get("usuario", payload.get("username", "")),
        rol=role,
    )


def require_admin_request(request: Request) -> AuditActor:
    """Ensure the requester is an authenticated admin."""
    actor = get_current_actor(request)
    if actor.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo el admin puede realizar esta accion")
    return actor
