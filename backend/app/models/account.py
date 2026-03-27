from datetime import datetime

from pydantic import BaseModel, Field


class AccountDetailsResponse(BaseModel):
    account_number: str
    currency: str
    balance: float
    created_at: datetime | None = None

