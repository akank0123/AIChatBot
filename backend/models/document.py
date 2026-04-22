from pydantic import BaseModel


class IngestURLRequest(BaseModel):
    url: str


class IngestTextRequest(BaseModel):
    text: str
    source: str = "paste"
