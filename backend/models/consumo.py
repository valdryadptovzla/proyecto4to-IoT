from datetime import datetime

from pydantic import BaseModel, Field


class ConsumoCreate(BaseModel):
    dispositivo_id: str = Field(..., min_length=1)
    consumo_watts: float = Field(..., gt=0)


class ConsumoUpdate(BaseModel):
    consumo_watts: float | None = Field(None, gt=0)


class ConsumoResponse(ConsumoCreate):
    id: str
    fecha: datetime | None = None