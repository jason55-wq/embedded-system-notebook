from functools import partial
import cgi
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
from pathlib import Path
import json
import os
import sqlite3
import socket
from datetime import datetime, timezone
from typing import Optional
from urllib import error, request
from urllib.parse import quote, urlparse


HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
OLLAMA_API_URL = "http://127.0.0.1:11434/api/chat"
OLLAMA_TAGS_URL = "http://127.0.0.1:11434/api/tags"
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")
DATABASE_PATH = Path(__file__).resolve().with_name("app.sqlite3")


def find_available_port(host: str, start_port: int, max_attempts: int = 20) -> int:
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            if os.name == "nt" and hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            try:
                sock.bind((host, port))
                return port
            except OSError:
                continue

    raise OSError(f"No available port found between {start_port} and {start_port + max_attempts - 1}.")


def get_local_ip_address() -> Optional[str]:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
    except OSError:
        return None


def init_database() -> None:
    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                content_type TEXT NOT NULL,
                size INTEGER NOT NULL,
                note TEXT,
                data BLOB NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.commit()


def get_db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def serialize_upload(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "filename": row["filename"],
        "content_type": row["content_type"],
        "size": row["size"],
        "note": row["note"],
        "created_at": row["created_at"],
        "download_url": f"/api/uploads/{row['id']}/download",
    }


def normalize_request_path(raw_path: str) -> str:
    if raw_path == "/":
        return raw_path

    return raw_path.rstrip("/") or "/"


class AppRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        request_path = normalize_request_path(urlparse(self.path).path)

        if request_path in {"/", "/index.html"}:
            self.serve_index()
            return

        if request_path == "/api/ollama/models":
            try:
                models = list_local_models()
            except (OSError, sqlite3.Error) as exc:
                self.send_json(502, {
                    "error": "Unable to reach Ollama. Make sure it is running on http://127.0.0.1:11434.",
                    "details": str(exc),
                })
                return

            self.send_json(200, {"models": models})
            return

        if request_path == "/api/uploads":
            try:
                uploads = list_uploads()
            except (OSError, sqlite3.Error) as exc:
                self.send_json(500, {
                    "error": "無法讀取上傳檔案資料庫。",
                    "details": str(exc),
                })
                return

            self.send_json(200, {"uploads": uploads})
            return

        if request_path.startswith("/api/uploads/") and request_path.endswith("/download"):
            upload_id = extract_upload_id(request_path)
            if upload_id is None:
                self.send_json(404, {"error": "找不到指定的檔案。"})
                return

            self.serve_uploaded_file(upload_id)
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
        request_path = normalize_request_path(urlparse(self.path).path)

        if request_path == "/api/uploads":
            self.handle_upload_request()
            return

        if request_path != "/api/ollama/chat":
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
        except (OSError, sqlite3.Error) as exc:
            self.send_json(502, {
                "error": "Unable to reach Ollama. Make sure it is running on http://127.0.0.1:11434.",
                "details": str(exc),
            })

    def handle_upload_request(self) -> None:
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self.send_json(400, {"error": "請使用 multipart/form-data 上傳檔案。"})
            return

        content_length = int(self.headers.get("Content-Length", "0") or 0)
        if content_length <= 0:
            self.send_json(400, {"error": "沒有收到上傳內容。"})
            return

        environ = {
            "REQUEST_METHOD": "POST",
            "CONTENT_TYPE": content_type,
            "CONTENT_LENGTH": str(content_length),
        }

        try:
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ=environ,
                keep_blank_values=True,
            )
        except Exception as exc:  # pragma: no cover - defensive parsing guard
            self.send_json(400, {
                "error": "無法解析上傳內容。",
                "details": str(exc),
            })
            return

        uploaded_files = form["files"] if "files" in form else []
        if not isinstance(uploaded_files, list):
            uploaded_files = [uploaded_files]

        valid_files = [item for item in uploaded_files if getattr(item, "filename", None)]
        if not valid_files:
            self.send_json(400, {"error": "請至少選擇一個有效檔案。"})
            return

        note = form.getfirst("note", "").strip()
        created_at = datetime.now().astimezone().isoformat(timespec="seconds")
        results: list[dict] = []

        try:
            with get_db_connection() as connection:
                for item in valid_files:
                    filename = os.path.basename(item.filename)
                    file_data = item.file.read()
                    if isinstance(file_data, str):
                        file_data = file_data.encode("utf-8")
                    file_size = len(file_data)
                    content_type = item.type or mimetypes.guess_type(filename)[0] or "application/octet-stream"

                    cursor = connection.execute(
                        """
                        INSERT INTO uploads (filename, content_type, size, note, data, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (filename, content_type, file_size, note or None, sqlite3.Binary(file_data), created_at),
                    )
                    results.append({
                        "id": cursor.lastrowid,
                        "filename": filename,
                        "content_type": content_type,
                        "size": file_size,
                        "note": note or None,
                        "created_at": created_at,
                        "download_url": f"/api/uploads/{cursor.lastrowid}/download",
                    })
                connection.commit()
        except (OSError, sqlite3.Error) as exc:
            self.send_json(500, {
                "error": "儲存上傳檔案時發生錯誤。",
                "details": str(exc),
            })
            return

        self.send_json(201, {"uploaded": results})

    def send_json(self, status_code: int, payload: dict) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_uploaded_file(self, upload_id: int) -> None:
        try:
            with get_db_connection() as connection:
                row = connection.execute(
                    "SELECT id, filename, content_type, size, data FROM uploads WHERE id = ?",
                    (upload_id,),
                ).fetchone()
        except OSError as exc:
            self.send_json(500, {
                "error": "無法讀取檔案資料。",
                "details": str(exc),
            })
            return

        if row is None:
            self.send_json(404, {"error": "檔案不存在。"})
            return

        filename = row["filename"]
        content_type = row["content_type"] or "application/octet-stream"
        data = row["data"]
        encoded_filename = quote(filename)

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{encoded_filename}")
        self.end_headers()
        self.wfile.write(data)


def list_local_models() -> list[str]:
    req = request.Request(OLLAMA_TAGS_URL, method="GET")
    with request.urlopen(req, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8"))

    models = payload.get("models", [])
    return [str(model.get("name", "")).strip() for model in models if model.get("name")]


def list_uploads() -> list[dict]:
    with get_db_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, filename, content_type, size, note, created_at
            FROM uploads
            ORDER BY id DESC
            LIMIT 100
            """
        ).fetchall()

    return [serialize_upload(row) for row in rows]


def extract_upload_id(request_path: str) -> Optional[int]:
    segments = [segment for segment in normalize_request_path(request_path).split("/") if segment]
    if len(segments) != 4:
        return None

    try:
        return int(segments[2])
    except ValueError:
        return None


def main() -> None:
    root = Path(__file__).resolve().parent
    handler = partial(AppRequestHandler, directory=str(root))
    init_database()
    port = find_available_port(HOST, PORT)
    server = ThreadingHTTPServer((HOST, port), handler)
    url = f"http://127.0.0.1:{port}/"
    local_ip = get_local_ip_address()

    print(f"Arduino Notebook is running at {url}")
    if local_ip:
        print(f"Network access URL: http://{local_ip}:{port}/")
    print(f"Upload database: {DATABASE_PATH.name}")
    print("Ollama chat endpoint: POST /api/ollama/chat")
    print("Upload endpoint: POST /api/uploads")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
