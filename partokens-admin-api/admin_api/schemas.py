from __future__ import annotations

from decimal import Decimal, InvalidOperation

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, SecretStr, field_validator


def _validate_cost_ratio(value: Decimal | float | int | str | None) -> Decimal | None:
    if value is None:
        return None
    try:
        decimal = value if isinstance(value, Decimal) else Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError("cost_ratio must be a non-negative decimal") from exc
    if not decimal.is_finite() or decimal < 0:
        raise ValueError("cost_ratio must be a non-negative decimal")
    if decimal.as_tuple().exponent < -3:
        raise ValueError("cost_ratio must have at most three decimal places")
    return decimal


class LogicalChannelCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=80)
    channel_type: int = Field(ge=1)
    base_url: HttpUrl
    api_key: SecretStr = Field(min_length=1)
    cost_ratio: Decimal | None = Field(default=None)
    models: list[str] = Field(min_length=1, max_length=200)
    model_mapping: str | None = None
    note: str = Field(default="", max_length=255)

    @field_validator("name", "note")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("cost_ratio", mode="before")
    @classmethod
    def validate_ratio(cls, value: Decimal | float | int | str | None) -> Decimal | None:
        return _validate_cost_ratio(value)

    @field_validator("models")
    @classmethod
    def normalize_models(cls, values: list[str]) -> list[str]:
        normalized = list(dict.fromkeys(value.strip() for value in values if value.strip()))
        if not normalized:
            raise ValueError("at least one model is required")
        if any(len(value) > 255 for value in normalized):
            raise ValueError("model names must not exceed 255 characters")
        return normalized


class LogicalChannelCopy(BaseModel):
    """Create a new credential variant from an existing channel.

    The source channel's secret is never read back or returned. A new secret is
    always required, while the non-sensitive fields may be overridden.
    """

    model_config = ConfigDict(extra="forbid")

    api_key: SecretStr = Field(min_length=1)
    name: str | None = Field(default=None, min_length=1, max_length=80)
    channel_type: int | None = Field(default=None, ge=1)
    base_url: HttpUrl | None = None
    cost_ratio: Decimal | None = Field(default=None)
    models: list[str] | None = Field(default=None, max_length=200)
    model_mapping: str | None = None
    note: str | None = Field(default=None, max_length=255)

    @field_validator("name", "note")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None

    @field_validator("cost_ratio", mode="before")
    @classmethod
    def validate_ratio(cls, value: Decimal | float | int | str | None) -> Decimal | None:
        return _validate_cost_ratio(value)

    @field_validator("models")
    @classmethod
    def normalize_optional_models(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        normalized = list(dict.fromkeys(value.strip() for value in values if value.strip()))
        if not normalized:
            raise ValueError("at least one model is required")
        if any(len(value) > 255 for value in normalized):
            raise ValueError("model names must not exceed 255 characters")
        return normalized


class ChannelModelDiscoveryRequest(BaseModel):
    """Credentials for a one-shot, unsaved channel model discovery."""

    model_config = ConfigDict(extra="forbid")

    channel_type: int = Field(ge=1)
    base_url: HttpUrl
    api_key: SecretStr = Field(min_length=1)


class LogicalChannelUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=80)
    cost_ratio: Decimal | None = Field(default=None)
    note: str | None = Field(default=None, max_length=255)

    @field_validator("name", "note")
    @classmethod
    def reject_null_and_strip_text(cls, value: str | None) -> str:
        if value is None:
            raise ValueError("field cannot be null")
        return value.strip()

    @field_validator("cost_ratio", mode="before")
    @classmethod
    def validate_ratio(cls, value: Decimal | float | int | str | None) -> Decimal | None:
        return _validate_cost_ratio(value)


class LogicalChannelStatus(BaseModel):
    enabled: bool


class ModelTestRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    models: list[str] = Field(min_length=1, max_length=100)

    @field_validator("models")
    @classmethod
    def normalize_models(cls, values: list[str]) -> list[str]:
        normalized = list(dict.fromkeys(value.strip() for value in values if value.strip()))
        if not normalized:
            raise ValueError("at least one model is required")
        if any(len(value) > 255 for value in normalized):
            raise ValueError("model names must not exceed 255 characters")
        return normalized


class ModelRemoveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    models: list[str] | None = Field(default=None, max_length=100)

    @field_validator("models")
    @classmethod
    def normalize_models(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        normalized = list(dict.fromkeys(value.strip() for value in values if value.strip()))
        if not normalized:
            raise ValueError("at least one model is required")
        if any(len(value) > 255 for value in normalized):
            raise ValueError("model names must not exceed 255 characters")
        return normalized


class ModelRemoveExecuteRequest(ModelRemoveRequest):
    change_id: str | None = Field(default=None, min_length=1, max_length=100)


class RouteMember(BaseModel):
    logical_id: str
    weight: int = Field(ge=1, le=1_000_000)


class RouteLayer(BaseModel):
    members: list[RouteMember] = Field(min_length=1)


class RoutePlanInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    layers: list[RouteLayer] = Field(min_length=1)
    acknowledge_nonstandard: bool = False
