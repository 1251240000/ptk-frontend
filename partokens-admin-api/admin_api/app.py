from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Annotated, Any, AsyncIterator

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .config import ConfigError, Settings
from .database import Database
from .monitor import Monitor
from .new_api import NewApiClient, NewApiError
from .repository import ConflictError, NotFoundError, Repository
from .routing import RouteValidationError
from .schemas import (
    ChannelModelDiscoveryRequest,
    LogicalChannelCopy,
    LogicalChannelCreate,
    LogicalChannelStatus,
    LogicalChannelUpdate,
    ModelRemoveExecuteRequest,
    ModelRemoveRequest,
    ModelTestRequest,
    RoutePlanInput,
)
from .service import AdminService


logger = logging.getLogger(__name__)


@dataclass
class Runtime:
    settings: Settings
    database: Database
    repository: Repository
    client: NewApiClient
    monitor: Monitor
    service: AdminService


def build_runtime(settings: Settings) -> Runtime:
    database = Database(settings.database_path)
    database.initialize()
    repository = Repository(database)
    repository.recover_model_test_tasks()
    client = NewApiClient(settings.new_api_origin, settings.request_timeout_seconds)
    monitor = Monitor(settings, repository, client)
    return Runtime(settings, database, repository, client, monitor, AdminService(repository, client, monitor))


def create_app(settings: Settings | None = None, runtime: Runtime | None = None) -> FastAPI:
    configured = settings or Settings.from_mapping()
    active_runtime = runtime or build_runtime(configured)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        active_runtime.monitor.start()
        yield
        await active_runtime.monitor.stop()
        await active_runtime.client.close()

    app = FastAPI(title="Partokens Admin API", version="0.1.0", docs_url=None, redoc_url=None, lifespan=lifespan)
    app.state.runtime = active_runtime

    @app.exception_handler(NewApiError)
    async def handle_new_api_error(_, exc: NewApiError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"success": False, "data": None, "message": str(exc)})

    @app.exception_handler(RouteValidationError)
    @app.exception_handler(ConflictError)
    async def handle_conflict(_, exc: Exception) -> JSONResponse:
        return JSONResponse(status_code=409, content={"success": False, "data": None, "message": str(exc)})

    @app.exception_handler(NotFoundError)
    async def handle_not_found(_, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"success": False, "data": None, "message": str(exc)})

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_, exc: RequestValidationError) -> JSONResponse:
        errors = [
            {
                "location": [str(part) for part in error.get("loc", ())],
                "message": str(error.get("msg", "Invalid value")),
                "type": str(error.get("type", "validation_error")),
            }
            for error in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={"success": False, "data": None, "message": "Invalid request", "errors": errors},
        )

    @app.exception_handler(HTTPException)
    async def handle_http_error(_, exc: HTTPException) -> JSONResponse:
        message = exc.detail if isinstance(exc.detail, str) else "Request failed"
        return JSONResponse(status_code=exc.status_code, content={"success": False, "data": None, "message": message})

    async def root_context(authorization: Annotated[str | None, Header()] = None) -> tuple[str, dict[str, Any]]:
        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(status_code=401, detail="Root session is required")
        user = await active_runtime.client.verify_root(authorization)
        return authorization, user

    @app.get("/healthz")
    async def health() -> dict[str, Any]:
        return {"status": "ok", "database": "sqlite", "monitor_configured": bool(configured.service_token)}

    @app.get("/v1/bootstrap")
    async def bootstrap(context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, _ = context
        return {"success": True, "data": await active_runtime.service.bootstrap(authorization)}

    @app.get("/v1/channels")
    async def channels(_: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        return {"success": True, "data": active_runtime.repository.public_channels()}

    @app.post("/v1/channels", status_code=201)
    async def create_channel(request: LogicalChannelCreate, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, actor = context
        return {"success": True, "data": await active_runtime.service.create_channel(authorization, request, actor)}

    @app.post("/v1/channels/{logical_id}/copy", status_code=201)
    async def copy_channel(logical_id: str, request: LogicalChannelCopy, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, actor = context
        return {"success": True, "data": await active_runtime.service.copy_channel(authorization, logical_id, request, actor)}

    @app.patch("/v1/channels/{logical_id}")
    async def update_channel(logical_id: str, request: LogicalChannelUpdate, _: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        return {"success": True, "data": active_runtime.service.update_channel(logical_id, request)}

    @app.post("/v1/channels/{logical_id}/status")
    async def channel_status(logical_id: str, request: LogicalChannelStatus, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, _ = context
        return {"success": True, "data": await active_runtime.service.set_channel_status(authorization, logical_id, request)}

    @app.post("/v1/channels/{logical_id}/test")
    async def test_channel(logical_id: str, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, _ = context
        return {"success": True, "data": await active_runtime.service.test_channel(authorization, logical_id)}

    @app.get("/v1/channels/{logical_id}/models/discover")
    async def discover_models(logical_id: str, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, _ = context
        return {"success": True, "data": await active_runtime.service.discover_models(authorization, logical_id)}

    @app.post("/v1/channels/models/discover")
    async def discover_models_preview(request: ChannelModelDiscoveryRequest, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, _ = context
        return {"success": True, "data": await active_runtime.service.discover_models_preview(authorization, request)}

    @app.post("/v1/channels/{logical_id}/models/test")
    async def test_models(logical_id: str, request: ModelTestRequest, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, actor = context
        return {"success": True, "data": await active_runtime.service.start_model_test(authorization, logical_id, request.models, actor)}

    @app.post("/v1/channels/{logical_id}/models/remove/preview")
    async def preview_model_remove(logical_id: str, request: ModelRemoveRequest, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, _ = context
        return {"success": True, "data": await active_runtime.service.preview_model_remove(authorization, logical_id, request.models)}

    @app.post("/v1/channels/{logical_id}/models/remove/execute")
    async def execute_model_remove(logical_id: str, request: ModelRemoveExecuteRequest, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, actor = context
        if request.change_id:
            return {"success": True, "data": await active_runtime.service.continue_change(authorization, request.change_id)}
        return {"success": True, "data": await active_runtime.service.execute_model_remove(authorization, logical_id, request.models, actor)}

    @app.get("/v1/model-tests/{task_id}")
    async def get_model_test(task_id: str, _: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        return {"success": True, "data": await active_runtime.service.get_model_test(task_id)}

    @app.post("/v1/model-tests/{task_id}/cancel")
    async def cancel_model_test(task_id: str, _: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        return {"success": True, "data": await active_runtime.service.cancel_model_test(task_id)}

    @app.get("/v1/routes")
    async def routes(_: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        return {"success": True, "data": active_runtime.repository.routes()}

    @app.post("/v1/routes/{group}/preview")
    async def preview_route(group: str, request: RoutePlanInput, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, _ = context
        return {"success": True, "data": await active_runtime.service.preview_route(authorization, group, request)}

    @app.post("/v1/routes/{group}/execute")
    async def execute_route(group: str, request: RoutePlanInput, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, actor = context
        return {"success": True, "data": await active_runtime.service.execute_route(authorization, group, request, actor)}

    @app.get("/v1/changes")
    async def changes(_: tuple[str, dict[str, Any]] = Depends(root_context), limit: int = Query(50, ge=1, le=200)) -> dict[str, Any]:
        return {"success": True, "data": active_runtime.repository.changes(limit)}

    @app.post("/v1/changes/{change_id}/continue")
    async def continue_change(change_id: str, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, _ = context
        return {"success": True, "data": await active_runtime.service.continue_change(authorization, change_id)}

    @app.get("/v1/monitor")
    async def monitor(_: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        return {"success": True, "data": active_runtime.database.latest_snapshot()}

    @app.post("/v1/monitor/refresh")
    async def refresh_monitor(context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, _ = context
        return {"success": True, "data": await active_runtime.monitor.refresh(authorization, include_logs=True)}

    return app


try:
    app = create_app()
except ConfigError as exc:
    logger.error("Invalid administrator API configuration: %s", exc)
    raise
