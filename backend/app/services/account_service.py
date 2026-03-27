from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status


async def get_account_details(db, *, user_id: str) -> dict:
    accounts_col = db["accounts"]
    account = await accounts_col.find_one({"user_id": user_id})
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    return {
        "account_number": account.get("account_number"),
        "currency": account.get("currency", "INR"),
        "balance": float(account.get("balance", 0.0)),
        "created_at": account.get("created_at"),
    }

