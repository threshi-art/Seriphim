"""EiRAM Windows-double-click entrypoint.

This launches the FastAPI server using uvicorn.

PyInstaller will bundle this script into an .exe so you can start the server
without a separate terminal.
"""

from __future__ import annotations

import logging
import sys
import time
import webbrowser
from pathlib import Path
from typing import Optional

import uvicorn


def _setup_logging(log_path: Path) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(str(log_path), encoding="utf-8"),
        ],
    )


def main(host: str = "127.0.0.1", port: int = 8000, open_browser: bool = False) -> None:
    """Start the EiRAM FastAPI service."""

    project_root = Path(__file__).resolve().parent
    # Ensure `import app...` works even when launched from an .exe.
    sys.path.insert(0, str(project_root))

    log_path = project_root / "logs" / "eiram_server.log"
    _setup_logging(log_path)

    logging.info("Starting EiRAM server at http://%s:%s", host, port)

    # Import after sys.path insertion.
    from app.main import app as eiram_app  # noqa: WPS433 (runtime import)

    url = f"http://{host}:{port}/docs"
    if open_browser:
        # Slight delay so the browser opens after the server binds.
        time.sleep(0.6)
        try:
            webbrowser.open(url)
        except Exception:  # pragma: no cover
            logging.exception("Failed to open browser to %s", url)

    # When bundled, uvicorn may not have a real console attached, which can break
    # its default logging formatter setup. We disable uvicorn's log_config and
    # rely on our own file logger configured above.
    uvicorn.run(
        eiram_app,
        host=host,
        port=port,
        log_level="info",
        log_config=None,
        access_log=False,
        use_colors=False,
    )


if __name__ == "__main__":
    # PyInstaller builds use --noconsole, so there is no terminal feedback on
    # double-click. Opening /docs makes it obvious the server started.
    is_frozen = getattr(sys, "frozen", False)
    main(open_browser=is_frozen)
