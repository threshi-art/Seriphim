"""Serve the static Seraphim fallback preview without Node or pnpm."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial


HOST = "127.0.0.1"
PORT = 4177
PREVIEW_DIR = Path(__file__).with_name("preview")


def main() -> None:
    """Start the static preview server."""

    handler = partial(SimpleHTTPRequestHandler, directory=str(PREVIEW_DIR))
    server = ThreadingHTTPServer((HOST, PORT), handler)
    print(f"Seraphim static preview: http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop.")
    server.serve_forever()


if __name__ == "__main__":
    main()
