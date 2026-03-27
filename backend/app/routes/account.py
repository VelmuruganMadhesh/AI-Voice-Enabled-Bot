from fastapi import APIRouter, Depends

from app.core.config import get_settings
from app.core.response import api_response
from app.core.security import get_current_user
from app.services.account_service import get_account_details
from database.mongo import get_database


router = APIRouter(prefix="/account", tags=["account"])


@router.get("/details")
async def account_details(current_user: dict = Depends(get_current_user)):
    settings = get_settings()
    db = get_database(settings.mongodb_uri, settings.mongo_db_name)
    user_id = str(current_user["_id"])
    details = await get_account_details(db, user_id=user_id)
    return api_response(True, data=details, message="Account details fetched successfully")

