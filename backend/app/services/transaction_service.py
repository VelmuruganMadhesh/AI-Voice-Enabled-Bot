from datetime import datetime
from fastapi import HTTPException, status
from bson import ObjectId


def _normalize_transaction_type(tx_type: str) -> str:
    normalized = (tx_type or "").strip().lower()
    if normalized not in {"credit", "debit"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction type must be credit or debit.")
    return normalized


def _balance_delta(*, tx_type: str, amount: float) -> float:
    normalized_type = _normalize_transaction_type(tx_type)
    normalized_amount = float(amount)
    return normalized_amount if normalized_type == "credit" else -normalized_amount


async def _get_account_for_user(db, *, user_id: str, account_number: str) -> dict:
    accounts_col = db["accounts"]
    account = await accounts_col.find_one({"user_id": user_id, "account_number": account_number})
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found for this user.")
    return account


async def _apply_account_balance_change(db, *, account_id: ObjectId, amount_delta: float) -> None:
    accounts_col = db["accounts"]
    result = await accounts_col.update_one({"_id": account_id}, {"$inc": {"balance": amount_delta}})
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")


def _tx_doc_to_response(doc: dict) -> dict:
    return {
        "_id": str(doc.get("_id")),
        "account_id": str(doc.get("account_id")) if doc.get("account_id") else None,
        "account_number": doc.get("account_number"),
        "type": doc.get("type"),
        "amount": float(doc.get("amount", 0)),
        "description": doc.get("description"),
        "date": doc.get("date"),
    }


async def list_transactions(db, *, user_id: str, limit: int = 50) -> list[dict]:
    tx_col = db["transactions"]
    cursor = (
        tx_col.find({"user_id": user_id})
        .sort("date", -1)
        .limit(max(1, min(limit, 200)))
    )
    docs = await cursor.to_list(length=max(1, min(limit, 200)))
    return [_tx_doc_to_response(d) for d in docs]


async def create_transaction(db, *, user_id: str, payload: dict) -> dict:
    tx_col = db["transactions"]
    account = await _get_account_for_user(db, user_id=user_id, account_number=payload["account_number"])
    account_id = account["_id"]
    tx_type = _normalize_transaction_type(payload["type"])
    amount = float(payload["amount"])

    doc = {
        "user_id": user_id,
        "account_id": account_id,
        "account_number": payload["account_number"],
        "type": tx_type,
        "amount": amount,
        "description": payload.get("description"),
        "date": payload.get("date") or datetime.utcnow(),
    }

    await _apply_account_balance_change(db, account_id=account_id, amount_delta=_balance_delta(tx_type=tx_type, amount=amount))
    result = await tx_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _tx_doc_to_response(doc)


async def get_transaction(db, *, user_id: str, tx_id: str) -> dict:
    tx_col = db["transactions"]
    try:
        obj_id = ObjectId(tx_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid transaction id.")

    doc = await tx_col.find_one({"_id": obj_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")
    return _tx_doc_to_response(doc)


async def update_transaction(db, *, user_id: str, tx_id: str, payload: dict) -> dict:
    tx_col = db["transactions"]
    try:
        obj_id = ObjectId(tx_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid transaction id.")

    existing = await tx_col.find_one({"_id": obj_id, "user_id": user_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    update_doc: dict = {}
    for field in ["type", "amount", "description", "date"]:
        if field in payload and payload[field] is not None:
            update_doc[field] = payload[field]

    if not update_doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided to update.")

    next_type = _normalize_transaction_type(update_doc.get("type", existing.get("type")))
    next_amount = float(update_doc.get("amount", existing.get("amount", 0)))
    previous_type = _normalize_transaction_type(existing.get("type", ""))
    previous_amount = float(existing.get("amount", 0))

    account_id_raw = existing.get("account_id")
    if account_id_raw:
        account_id = account_id_raw if isinstance(account_id_raw, ObjectId) else ObjectId(account_id_raw)
    else:
        account = await _get_account_for_user(db, user_id=user_id, account_number=existing.get("account_number"))
        account_id = account["_id"]
        update_doc["account_id"] = account_id

    net_delta = _balance_delta(tx_type=next_type, amount=next_amount) - _balance_delta(tx_type=previous_type, amount=previous_amount)
    if net_delta:
        await _apply_account_balance_change(db, account_id=account_id, amount_delta=net_delta)

    update_doc["type"] = next_type
    update_doc["amount"] = next_amount
    await tx_col.update_one({"_id": obj_id, "user_id": user_id}, {"$set": update_doc})
    updated = await tx_col.find_one({"_id": obj_id, "user_id": user_id})
    return _tx_doc_to_response(updated)


async def delete_transaction(db, *, user_id: str, tx_id: str) -> dict:
    tx_col = db["transactions"]
    try:
        obj_id = ObjectId(tx_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid transaction id.")

    existing = await tx_col.find_one({"_id": obj_id, "user_id": user_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

    account_id_raw = existing.get("account_id")
    if account_id_raw:
        account_id = account_id_raw if isinstance(account_id_raw, ObjectId) else ObjectId(account_id_raw)
    else:
        account = await _get_account_for_user(db, user_id=user_id, account_number=existing.get("account_number"))
        account_id = account["_id"]

    reversal_delta = -_balance_delta(tx_type=existing.get("type", ""), amount=float(existing.get("amount", 0)))
    if reversal_delta:
        await _apply_account_balance_change(db, account_id=account_id, amount_delta=reversal_delta)

    await tx_col.delete_one({"_id": obj_id, "user_id": user_id})
    return {"deleted": True}

