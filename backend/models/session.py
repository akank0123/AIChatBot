from typing import Optional
from pydantic import BaseModel


class SessionUpdateRequest(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
