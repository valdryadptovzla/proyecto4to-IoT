from datetime import datetime

from pydantic import BaseModel, Field


class ConsumoCreate(BaseModel):
    dispositivo_id: str = Field(..., min_length=1)
    consumo_watts: float = Field(..., gt=0)


class ConsumoResponse(ConsumoCreate):
    id: str
    fecha_registro: datetime