from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import webbrowser


HOST = "127.0.0.1"
PORT = 8000


def main() -> None:
    root = Path(__file__).resolve().parent
    handler = lambda *args, **kwargs: SimpleHTTPRequestHandler(*args, directory=str(root), **kwargs)
    server = ThreadingHTTPServer((HOST, PORT), handler)
    url = f"http://{HOST}:{PORT}/index.html"

    print(f"Arduino Notebook is running at {url}")
    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
