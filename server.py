from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import socket


HOST = "127.0.0.1"
PORT = 8011


def find_available_port(host: str, start_port: int, max_attempts: int = 20) -> int:
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((host, port))
                return port
            except OSError:
                continue

    raise OSError(f"No available port found between {start_port} and {start_port + max_attempts - 1}.")


def main() -> None:
    root = Path(__file__).resolve().parent
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    port = find_available_port(HOST, PORT)
    server = ThreadingHTTPServer((HOST, port), handler)
    url = f"http://{HOST}:{port}/index.html"

    print(f"Arduino Notebook is running at {url}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
