from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TransactionCreateRequest(BaseModel):
    account_number: str = Field(..., min_length=4, max_length=30)
    type: str = Field(..., description="credit or debit")
    amount: float = Field(..., gt=0)
    description: Optional[str] = Field(None, max_length=500)
    date: Optional[datetime] = None


class TransactionUpdateRequest(BaseModel):
    type: Optional[str] = Field(None, description="credit or debit")
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = Field(None, max_length=500)
    date: Optional[datetime] = None


class TransactionResponse(BaseModel):
    id: str = Field(..., alias="_id")
    account_number: str
    type: str
    amount: float
    description: Optional[str] = None
    date: datetime

