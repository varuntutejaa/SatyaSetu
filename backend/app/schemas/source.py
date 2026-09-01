from pydantic import BaseModel


class SourceOut(BaseModel):
    id: str
    name: str
    domain: str
    category: str
    authority_level: str
    description: str
    verification_status: str
    last_checked: str
    allowed_for_verification: bool
    active: bool

    class Config:
        from_attributes = True
