from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape


@dataclass(frozen=True)
class RenderedEmail:
    html: str
    text: str


class VerificationTemplateRenderer:
    def __init__(self, template_dir: Path) -> None:
        self._environment = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml")),
            undefined=StrictUndefined,
            auto_reload=False,
        )
        self._html_template = self._environment.get_template("verification-code.html")
        self._text_template = self._environment.get_template("verification-code.txt")

    def render(self, code: str) -> RenderedEmail:
        params = {"code": code}
        return RenderedEmail(
            html=self._html_template.render(params=params),
            text=self._text_template.render(params=params),
        )


class PasswordResetTemplateRenderer:
    def __init__(self, template_dir: Path) -> None:
        self._environment = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml")),
            undefined=StrictUndefined,
            auto_reload=False,
        )
        self._html_template = self._environment.get_template("password-reset.html")
        self._text_template = self._environment.get_template("password-reset.txt")

    def render(self, reset_link: str) -> RenderedEmail:
        params = {"reset_link": reset_link}
        return RenderedEmail(
            html=self._html_template.render(params=params),
            text=self._text_template.render(params=params),
        )


class QuotaWarningTemplateRenderer:
    def __init__(self, template_dir: Path) -> None:
        self._environment = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml")),
            undefined=StrictUndefined,
            auto_reload=False,
        )
        self._html_template = self._environment.get_template("quota-warning.html")
        self._text_template = self._environment.get_template("quota-warning.txt")

    def render(self, remaining_quota: str) -> RenderedEmail:
        params = {"remaining_quota": remaining_quota}
        return RenderedEmail(
            html=self._html_template.render(params=params),
            text=self._text_template.render(params=params),
        )


class CustomerServiceTemplateRenderer:
    def __init__(self, template_dir: Path) -> None:
        self._environment = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml")),
            undefined=StrictUndefined,
            auto_reload=False,
        )
        self._html_template = self._environment.get_template(
            "customer-service-notice.html"
        )
        self._text_template = self._environment.get_template(
            "customer-service-notice.txt"
        )

    def render(
        self,
        credit_amount: str,
        outage_duration: str,
        notice_date: str,
    ) -> RenderedEmail:
        params = {
            "credit_amount": credit_amount,
            "outage_duration": outage_duration,
            "notice_date": notice_date,
        }
        return RenderedEmail(
            html=self._html_template.render(params=params),
            text=self._text_template.render(params=params),
        )
