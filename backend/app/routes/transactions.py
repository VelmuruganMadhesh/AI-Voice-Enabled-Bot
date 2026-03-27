from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import get_settings
from app.core.response import api_response
from app.core.security import get_current_user
from app.models.transaction import (
    TransactionCreateRequest,
    TransactionResponse,
    TransactionUpdateRequest,
)
from app.services.transaction_service import (
    create_transaction,
    delete_transaction,
    list_transactions,
    update_transaction,
    get_transaction,
)
from database.mongo import get_database


router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("")
async def list_user_transactions(current_user: dict = Depends(get_current_user), limit: int = 50):
    settings = get_settings()
    db = get_database(settings.mongodb_uri, settings.mongo_db_name)
    user_id = str(current_user["_id"])
    txs = await list_transactions(db, user_id=user_id, limit=limit)
    return api_response(True, data={"items": txs}, message="Transactions fetched successfully")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user_transaction(
    payload: TransactionCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    settings = get_settings()
    db = get_database(settings.mongodb_uri, settings.mongo_db_name)
    user_id = str(current_user["_id"])
    tx = await create_transaction(db, user_id=user_id, payload=payload.model_dump())
    return api_response(True, data={"item": tx}, message="Transaction created successfully")


@router.get("/{tx_id}")
async def get_user_transaction(
    tx_id: str,
    current_user: dict = Depends(get_current_user),
):
    settings = get_settings()
    db = get_database(settings.mongodb_uri, settings.mongo_db_name)
    user_id = str(current_user["_id"])
    tx = await get_transaction(db, user_id=user_id, tx_id=tx_id)
    return api_response(True, data={"item": tx}, message="Transaction fetched successfully")


@router.put("/{tx_id}")
async def update_user_transaction(
    tx_id: str,
    payload: TransactionUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    settings = get_settings()
    db = get_database(settings.mongodb_uri, settings.mongo_db_name)
    user_id = str(current_user["_id"])
    tx = await update_transaction(db, user_id=user_id, tx_id=tx_id, payload=payload.model_dump(exclude_unset=True))
    return api_response(True, data={"item": tx}, message="Transaction updated successfully")


@router.delete("/{tx_id}")
async def delete_user_transaction(
    tx_id: str,
    current_user: dict = Depends(get_current_user),
):
    settings = get_settings()
    db = get_database(settings.mongodb_uri, settings.mongo_db_name)
    user_id = str(current_user["_id"])
    result = await delete_transaction(db, user_id=user_id, tx_id=tx_id)
    return api_response(True, data=result, message="Transaction deleted successfully")

