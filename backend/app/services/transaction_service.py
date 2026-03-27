from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from bson import ObjectId


def _tx_doc_to_response(doc: dict) -> dict:
    return {
        "_id": str(doc.get("_id")),
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
    doc = {
        "user_id": user_id,
        "account_number": payload["account_number"],
        "type": payload["type"],
        "amount": payload["amount"],
        "description": payload.get("description"),
        "date": payload.get("date") or datetime.utcnow(),
    }
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

    update_doc: dict = {}
    for field in ["type", "amount", "description", "date"]:
        if field in payload and payload[field] is not None:
            update_doc[field] = payload[field]

    if not update_doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided to update.")

    await tx_col.update_one({"_id": obj_id, "user_id": user_id}, {"$set": update_doc})
    updated = await tx_col.find_one({"_id": obj_id, "user_id": user_id})
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")
    return _tx_doc_to_response(updated)


async def delete_transaction(db, *, user_id: str, tx_id: str) -> dict:
    tx_col = db["transactions"]
    try:
        obj_id = ObjectId(tx_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid transaction id.")

    result = await tx_col.delete_one({"_id": obj_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")
    return {"deleted": True}

