import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any

from fastapi import HTTPException, Request

from ..database import usuarios_collection
from ..models.auditoria import AuditActor


TOKEN_SECRET = os.getenv("TOKEN_SECRET", "dev-secret-change-me")
TOKEN_TTL_SECONDS = int(os.getenv("TOKEN_TTL_SECONDS", str(60 * 60 * 8)))


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _sign(payload: str) -> str:
    signature = hmac.new(TOKEN_SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256)
    return _b64encode(signature.digest())


def create_access_token(user: dict[str, Any]) -> str:
    role = user.get("rol", "usuario")
    if role not in {"admin", "usuario"}:
        role = "usuario"
    payload = {
        "sub": str(user["_id"]),
        "username": user.get("username") or user.get("usuario", ""),
        "rol": role,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    encoded_payload = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    return f"{encoded_payload}.{_sign(encoded_payload)}"


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        encoded_payload, signature = token.split(".", 1)
    except ValueError:
        raise HTTPException(status_code=401, detail="Token invalido")

    if not hmac.compare_digest(signature, _sign(encoded_payload)):
        raise HTTPException(status_code=401, detail="Token invalido")

    try:
        payload = json.loads(_b64decode(encoded_payload))
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Token invalido")

    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=401, detail="Sesion expirada")

    return payload


def get_token_from_request(request: Request) -> str | None:
    authorization = request.headers.get("authorization", "")
    if authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


def get_current_actor(request: Request) -> AuditActor:
    token = get_token_from_request(request)
    if token:
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

    # Compatibility for local scripts and the existing frontend while migrating.
    role = request.headers.get("x-user-role")
    username = request.headers.get("x-username")
    if role and username:
        return AuditActor(
            user_id=request.headers.get("x-user-id"),
            username=username,
            rol=role,
        )

    raise HTTPException(status_code=401, detail="Sesion requerida")


def require_admin_request(request: Request) -> AuditActor:
    actor = get_current_actor(request)
    if actor.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo el admin puede realizar esta accion")
    return actor
