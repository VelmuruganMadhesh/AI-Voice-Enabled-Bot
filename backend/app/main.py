import os
import sys

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

AI_MODULE_DIR = os.path.join(ROOT_DIR, "ai-module")
if AI_MODULE_DIR not in sys.path:
    sys.path.insert(0, AI_MODULE_DIR)

from app.core.config import get_settings
from app.core.response import api_response
from app.routes.auth import router as auth_router
from app.routes.transactions import router as transactions_router
from app.routes.account import router as account_router
from app.routes.voice import router as voice_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Multilingual Voice-Enabled Banking Support System", version="0.1.0")

    origins = [o.strip() for o in settings.cors_origins.split(",")] if settings.cors_origins else ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins != [""] else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=api_response(False, data={}, message=str(exc.detail)),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        # In production, log exc details with a proper logger.
        exc_name = exc.__class__.__name__
        exc_msg = str(exc).lower()
        if exc_name == "ServerSelectionTimeoutError" or "serverselectiontimeouterror" in exc_name.lower():
            return JSONResponse(
                status_code=503,
                content=api_response(False, data={}, message="Database unavailable. Please ensure MongoDB is running."),
            )
        if "connection refused" in exc_msg or "timed out" in exc_msg or "network is unreachable" in exc_msg:
            return JSONResponse(
                status_code=503,
                content=api_response(False, data={}, message="Database unavailable. Please ensure MongoDB is running."),
            )
        return JSONResponse(
            status_code=500,
            content=api_response(False, data={}, message="Internal server error"),
        )

    @app.get("/")
    async def health():
        return api_response(True, data={"service": "ok"}, message="Service is running")

    app.include_router(auth_router, prefix=settings.api_base_path)
    app.include_router(transactions_router, prefix=settings.api_base_path)
    app.include_router(account_router, prefix=settings.api_base_path)
    app.include_router(voice_router, prefix=settings.api_base_path)
    return app


app = create_app()

