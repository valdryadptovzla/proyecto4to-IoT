from typing import Literal

from pydantic import BaseModel, Field


EstadoDispositivo = Literal["encendido", "apagado"]


class DispositivoBase(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100)
    tipo: str = Field(..., min_length=3, max_length=50)
    ubicacion: str = Field(..., min_length=2, max_length=100)
    estado: EstadoDispositivo = "apagado"


class DispositivoCreate(DispositivoBase):
    pass


class DispositivoUpdate(BaseModel):
    estado: EstadoDispositivo


class DispositivoResponse(DispositivoBase):
    id: str