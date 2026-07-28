from __future__ import annotations

import re
import unicodedata
from email import policy
from email.message import EmailMessage, Message
from email.parser import BytesParser
from html.parser import HTMLParser


class VerificationCodeNotFound(ValueError):
    """Raised when an incoming message does not contain a supported code."""


CODE_PATTERNS = (
    re.compile(
        r"(?:您的)?验证码(?:为)?\s*[:：]?\s*([0-9a-f]{6})(?![0-9a-f])",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:email\s+)?verification\s+code\s*(?:is|:)?\s*"
        r"([0-9a-f]{6})(?![0-9a-f])",
        re.IGNORECASE,
    ),
)


class _HTMLTextExtractor(HTMLParser):
    BLOCK_TAGS = {
        "br",
        "div",
        "li",
        "p",
        "table",
        "td",
        "th",
        "tr",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._parts: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        if tag.lower() in self.BLOCK_TAGS:
            self._parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in self.BLOCK_TAGS:
            self._parts.append("\n")

    def handle_data(self, data: str) -> None:
        self._parts.append(data)

    def text(self) -> str:
        return "".join(self._parts)


def html_to_text(value: str) -> str:
    parser = _HTMLTextExtractor()
    parser.feed(value)
    parser.close()
    return parser.text()


def _decoded_content(part: Message) -> str:
    try:
        content = part.get_content()
        if isinstance(content, str):
            return content
    except (LookupError, TypeError, UnicodeError):
        pass

    payload = part.get_payload(decode=True)
    if payload is None:
        raw_payload = part.get_payload()
        return raw_payload if isinstance(raw_payload, str) else ""
    charset = part.get_content_charset() or "utf-8"
    try:
        return payload.decode(charset, errors="replace")
    except LookupError:
        return payload.decode("utf-8", errors="replace")


def _body_candidates(message: EmailMessage) -> list[str]:
    candidates: list[tuple[int, str]] = []
    for part in message.walk():
        if part.is_multipart():
            continue
        if part.get_content_disposition() == "attachment":
            continue
        content_type = part.get_content_type().lower()
        if content_type not in {"text/plain", "text/html"}:
            continue
        content = _decoded_content(part)
        if content_type == "text/html":
            content = html_to_text(content)
            priority = 1
        else:
            priority = 0
        candidates.append((priority, content))
    return [content for _, content in sorted(candidates, key=lambda item: item[0])]


def extract_code_from_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value)
    for pattern in CODE_PATTERNS:
        match = pattern.search(normalized)
        if match:
            return match.group(1).lower()
    raise VerificationCodeNotFound("verification code not found")


def extract_verification_code(raw_message: bytes) -> str:
    message = BytesParser(policy=policy.default).parsebytes(raw_message)
    if not isinstance(message, EmailMessage):
        raise VerificationCodeNotFound("message could not be parsed")
    for body in _body_candidates(message):
        try:
            return extract_code_from_text(body)
        except VerificationCodeNotFound:
            continue
    raise VerificationCodeNotFound("verification code not found in message body")
