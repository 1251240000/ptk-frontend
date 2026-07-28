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
