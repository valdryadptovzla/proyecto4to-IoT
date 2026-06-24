from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


RolUsuario = Literal["admin", "usuario"]


class UsuarioCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    nombre_completo: str = Field(..., min_length=3, max_length=100)
    rol: RolUsuario = "usuario"


class UsuarioUpdate(BaseModel):
    nombre_completo: str | None = Field(None, min_length=3, max_length=100)
    rol: RolUsuario | None = None
    password: str | None = Field(None, min_length=6, max_length=100)


class UsuarioResponse(BaseModel):
    id: str
    username: str
    nombre_completo: str
    rol: RolUsuario
    fecha_creacion: datetime | None = None


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4, max_length=100)
