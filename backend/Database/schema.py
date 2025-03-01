from pydantic import BaseModel, EmailStr
from typing import Optional

class PasswordUpdateSchema(BaseModel):
    user_id: str
    new_password: str
