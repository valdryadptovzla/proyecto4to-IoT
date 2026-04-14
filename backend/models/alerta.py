from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


NivelAlerta = Literal["info", "advertencia", "critica"]


class AlertaCreate(BaseModel):
    dispositivo_id: str = Field(..., min_length=1)
    mensaje: str = Field(..., min_length=5, max_length=250)
    nivel: NivelAlerta = "advertencia"


class AlertaResponse(AlertaCreate):
    id: str
    fecha_registro: datetime