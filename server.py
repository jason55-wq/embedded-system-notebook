from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os
import socket
from urllib import error, request


HOST = "127.0.0.1"
PORT = int(os.getenv("PORT", "8000"))
OLLAMA_API_URL = "http://127.0.0.1:11434/api/chat"
OLLAMA_TAGS_URL = "http://127.0.0.1:11434/api/tags"
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")


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


class AppRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path in {"/", "/index.html"}:
            self.serve_index()
            return

        if self.path == "/api/ollama/models":
            try:
                models = list_local_models()
            except OSError as exc:
                self.send_json(502, {
                    "error": "Unable to reach Ollama. Make sure it is running on http://127.0.0.1:11434.",
                    "details": str(exc),
                })
                return

            self.send_json(200, {"models": models})
            return

        super().do_GET()

    def serve_index(self) -> None:
        root = Path(self.directory)
        index_path = root / "index.html"

        try:
            data = index_path.read_bytes()
        except OSError as exc:
            self.send_json(404, {
                "error": "index.html not found.",
                "details": str(exc),
            })
            return

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/api/ollama/chat":
            self.send_error(404, "Not Found")
            return

        content_length = int(self.headers.get("Content-Length", "0") or 0)
        raw_body = self.rfile.read(content_length)

        try:
            payload = json.loads(raw_body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self.send_json(400, {"error": "Invalid JSON payload."})
            return

        messages = payload.get("messages")
        if not isinstance(messages, list):
            self.send_json(400, {"error": "`messages` must be an array."})
            return

        try:
            available_models = list_local_models()
        except OSError as exc:
            self.send_json(502, {
                "error": "Unable to reach Ollama. Make sure it is running on http://127.0.0.1:11434.",
                "details": str(exc),
            })
            return

        requested_model = str(payload.get("model") or "").strip()
        if requested_model:
            if requested_model not in available_models:
                self.send_json(400, {
                    "error": f"Model '{requested_model}' is not installed in Ollama.",
                    "available_models": available_models,
                })
                return
            model = requested_model
        else:
            if not available_models:
                self.send_json(400, {
                    "error": "No local Ollama models are installed.",
                })
                return
            model = available_models[0]

        ollama_payload = json.dumps({
            "model": model,
            "messages": messages,
            "stream": False,
        }).encode("utf-8")

        ollama_request = request.Request(
            OLLAMA_API_URL,
            data=ollama_payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with request.urlopen(ollama_request, timeout=120) as response:
                response_body = response.read()
                self.send_response(response.status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(response_body)))
                self.end_headers()
                self.wfile.write(response_body)
        except error.HTTPError as exc:
            details = exc.read().decode("utf-8", "replace")
            self.send_json(exc.code, {
                "error": "Ollama returned an error.",
                "details": details,
            })
        except OSError as exc:
            self.send_json(502, {
                "error": "Unable to reach Ollama. Make sure it is running on http://127.0.0.1:11434.",
                "details": str(exc),
            })

    def send_json(self, status_code: int, payload: dict) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def list_local_models() -> list[str]:
    req = request.Request(OLLAMA_TAGS_URL, method="GET")
    with request.urlopen(req, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8"))

    models = payload.get("models", [])
    return [str(model.get("name", "")).strip() for model in models if model.get("name")]


def main() -> None:
    root = Path(__file__).resolve().parent
    handler = partial(AppRequestHandler, directory=str(root))
    port = find_available_port(HOST, PORT)
    server = ThreadingHTTPServer((HOST, port), handler)
    url = f"http://{HOST}:{port}/"

    print(f"Arduino Notebook is running at {url}")
    print("Ollama chat endpoint: POST /api/ollama/chat")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
