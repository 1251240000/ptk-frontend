from __future__ import annotations

import os
import socket


def run() -> int:
    host = os.getenv("HEALTHCHECK_HOST", "127.0.0.1")
    port = int(os.getenv("SMTP_LISTEN_PORT", "2525"))
    try:
        with socket.create_connection((host, port), timeout=2.0) as connection:
            banner = connection.recv(256)
            if not banner.startswith(b"220"):
                return 1
            connection.sendall(b"QUIT\r\n")
    except (OSError, ValueError):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
