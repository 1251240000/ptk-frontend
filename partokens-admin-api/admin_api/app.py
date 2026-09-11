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
from .vault import CredentialVault
from .migration import audit, migrate_route


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
    if settings.encryption_key_file is None:
        raise ConfigError("PARTOKENS_ADMIN_ENCRYPTION_KEY_FILE is required")
    vault = CredentialVault.from_file(settings.encryption_key_file)
    database = Database(settings.database_path)
    database.initialize()
    repository = Repository(database, vault)
    for row in repository.logical_rows():
        if row.get("config_ciphertext"):
            repository.channel_config(row["id"])
    client = NewApiClient(settings.new_api_origin, settings.request_timeout_seconds)
    monitor = Monitor(settings, repository, client)
    return Runtime(settings, database, repository, client, monitor, AdminService(repository, client, monitor))


def create_app(settings: Settings | None = None, runtime: Runtime | None = None) -> FastAPI:
    configured = settings or Settings.from_mapping()
    active_runtime = runtime or build_runtime(configured)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        try:
            with active_runtime.repository.model_test_runtime():
                active_runtime.monitor.start()
                try:
                    yield
                finally:
                    models = getattr(active_runtime.service, "models", None)
                    if models is not None:
                        await models.stop()
                    await active_runtime.monitor.stop()
        finally:
            await active_runtime.client.close()

    app = FastAPI(title="Partokens Admin API", version="0.1.0", docs_url=None, redoc_url=None, lifespan=lifespan)
    app.state.runtime = active_runtime

    @app.middleware("http")
    async def no_cache(request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        return response

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
                "location": [str(part) for part in error.get("loc", ())] if error.get("type") != "extra_forbidden" else ["body"],
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

    @app.get("/v1/migration/audit")
    async def migration_audit(context=Depends(root_context)) -> dict[str, Any]:
        return {"success": True, "data": await audit(active_runtime.repository, active_runtime.client, context[0])}

    @app.post("/v1/changes/{change_id}/migrate")
    async def migrate_change(change_id: str, context=Depends(root_context)) -> dict[str, Any]:
        return {"success": True, "data": await migrate_route(active_runtime.service, context[0], change_id)}

    @app.post("/v1/executions/{channel_id}/cleanup")
    async def cleanup_execution(channel_id: int, context=Depends(root_context)) -> dict[str, Any]:
        from .domain import channel_metadata
        service = active_runtime.service
        async with service.routes._execution_lock, service.models._change_lock:
            channel = await service.routes.executions.require_owned(context[0], channel_id)
            metadata = channel_metadata(channel)
            if int(channel.get("status", 0)) != 2 or metadata.get("kind") not in {"template", "probe", "archive"}:
                raise ConflictError("仅可清理已禁用的遗留模板、测试或归档记录")
            if active_runtime.repository.active_model_test_task(metadata["logical_id"]):
                raise ConflictError("渠道正在测试，请稍后清理")
            if any(channel_id in change["plan"].get("old_channel_ids", []) for change in active_runtime.repository.unfinished_route_changes()):
                raise ConflictError("执行记录仍被未完成变更引用")
            await service.routes.executions.delete(context[0], channel_id, metadata["logical_id"])
        return {"success": True, "data": {"channel_id": channel_id}}

    @app.get("/v1/channels")
    async def channels(context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        return {"success": True, "data": await active_runtime.service.list_channels(context[0])}

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

    @app.delete("/v1/channels/{logical_id}")
    async def delete_channel(logical_id: str, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, _ = context
        return {"success": True, "data": await active_runtime.service.delete_channel(authorization, logical_id)}

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
            change = active_runtime.service.repository.change(request.change_id)
            if change["kind"] != "model_remove" or change["target"] != logical_id:
                raise ConflictError("变更记录不属于该渠道的模型移除")
            return {"success": True, "data": await active_runtime.service.continue_change(authorization, request.change_id)}
        return {"success": True, "data": await active_runtime.service.execute_model_remove(authorization, logical_id, request.models, actor, request.preview_token)}

    @app.post("/v1/channels/{logical_id}/models/update/preview")
    async def preview_model_update(logical_id: str, request: ModelRemoveRequest, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, _ = context
        return {"success": True, "data": await active_runtime.service.models.preview_add(authorization, logical_id, request.models)}

    @app.post("/v1/channels/{logical_id}/models/update/execute")
    async def execute_model_update(logical_id: str, request: ModelRemoveExecuteRequest, context: tuple[str, dict[str, Any]] = Depends(root_context)) -> dict[str, Any]:
        authorization, actor = context
        if request.change_id:
            change = active_runtime.repository.change(request.change_id)
            if change["kind"] != "model_update" or change["target"] != logical_id:
                raise ConflictError("变更记录不属于该渠道的模型更新")
            return {"success": True, "data": await active_runtime.service.continue_change(authorization, request.change_id)}
        return {"success": True, "data": await active_runtime.service.execute_model_remove(authorization, logical_id, request.models, actor, request.preview_token, adding=True)}

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
