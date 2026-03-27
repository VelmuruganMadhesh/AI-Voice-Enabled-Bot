from functools import lru_cache

from motor.motor_asyncio import AsyncIOMotorClient


@lru_cache(maxsize=4)
def get_mongo_client(mongo_uri: str) -> AsyncIOMotorClient:
    # Motor client is async-safe and can be reused.
    # Set a short server selection timeout so API calls fail fast when MongoDB is down.
    return AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=5000)


def get_database(mongo_uri: str, db_name: str):
    client = get_mongo_client(mongo_uri)
    return client[db_name]

