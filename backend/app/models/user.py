from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserPublic(BaseModel):
    id: str = Field(..., alias="_id")
    name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    language: Optional[str] = None


class UserCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(None, min_length=6, max_length=20)
    password: str = Field(..., min_length=8)
    language: Optional[str] = Field(None, description="User preferred language: ta/hi/en")


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

