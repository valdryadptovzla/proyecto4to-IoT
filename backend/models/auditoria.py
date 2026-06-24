from datetime import datetime

from pydantic import BaseModel, Field


class AuditActor(BaseModel):
    user_id: str | None = None
    username: str = Field(..., min_length=1, max_length=100)
    rol: str = Field(..., min_length=1, max_length=50)


class AuditEventCreate(BaseModel):
    accion: str = Field(..., min_length=3, max_length=100)
    descripcion: str = Field(..., min_length=3, max_length=300)
    detalles: dict[str, object] = Field(default_factory=dict)
    entidad: str | None = Field(default=None, max_length=100)
    entidad_id: str | None = Field(default=None, max_length=100)


class AuditEventResponse(BaseModel):
    id: str
    accion: str
    actor: AuditActor
    descripcion: str
    detalles: dict[str, object]
    entidad: str | None = None
    entidad_id: str | None = None
    fecha: datetime