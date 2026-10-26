from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class WorkLogCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str = Field(min_length=1)

    @field_validator("description")
    @classmethod
    def _description_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("no puede estar vacía")
        return value


class WorkLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    service_order_id: int
    description: str
    created_at: datetime
