from fastapi import HTTPException, status

from app.core.security import create_access_token, verify_password
from app.core.config import get_settings
from database.mongo import get_database


async def authenticate_user(*, email: str, password: str) -> tuple[str, dict]:
    settings = get_settings()
    db = get_database(settings.mongodb_uri, settings.mongo_db_name)
    users_col = db["users"]

    user = await users_col.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    if not verify_password(password, user.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    user_id = str(user["_id"])
    token = create_access_token(subject=user_id, settings=settings)
    user_public = {
        "_id": user_id,
        "name": user.get("name"),
        "email": user.get("email"),
        "phone": user.get("phone"),
        "language": user.get("language"),
    }
    return token, user_public

