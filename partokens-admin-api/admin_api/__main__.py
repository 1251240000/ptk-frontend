from __future__ import annotations

import uvicorn


def main(port: int = 8081) -> None:
    config = uvicorn.Config("admin_api.app:app", host="0.0.0.0", port=port, proxy_headers=True, forwarded_allow_ips="*")
    # Reserve the listener before importing the app or recovering persisted work.
    sock = config.bind_socket()
    try:
        uvicorn.Server(config).run(sockets=[sock])
    finally:
        sock.close()


if __name__ == "__main__":
    main()
