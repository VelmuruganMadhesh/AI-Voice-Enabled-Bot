from typing import Any, Optional

from fastapi.responses import JSONResponse


def api_response(success: bool, data: Optional[dict[str, Any]] = None, message: str = "") -> dict[str, Any]:
    """
    Standard JSON envelope required by the project.
    """

    return {
        "success": success,
        "data": data or {},
        "message": message,
    }


def api_error_response(message: str, status_code: int) -> JSONResponse:
    return JSONResponse(status_code=status_code, content=api_response(False, data={}, message=message))

