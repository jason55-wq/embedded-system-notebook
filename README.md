# Arduino Sample Code Notebook

一個給 Arduino / 嵌入式初學者使用的本機網頁工具，整合了筆記管理、Arduino 範例程式產生器、常見除錯提示、Ollama AI 對話，以及新增的檔案上傳功能。

## 主要功能

- Arduino 筆記：標題、標籤、內容都會儲存在瀏覽器 `localStorage`
- Code Builder：快速產生常見 Arduino 範例程式
- Debug Assistant：輸入常見錯誤關鍵字，取得排除建議
- Ollama AI：串接本機 Ollama 進行 Arduino 問答
- 檔案上傳：可將檔案上傳並保存到 SQLite 資料庫

## 檔案上傳功能

新增的上傳區可以：

- 一次選擇一個或多個檔案
- 在後端以 SQLite 儲存檔案內容與中繼資料
- 顯示已上傳檔案清單
- 下載已儲存的檔案

目前儲存的欄位包含：

- 檔名
- MIME 類型
- 檔案大小
- 備註
- 上傳時間
- 檔案內容本身

SQLite 資料庫檔會建立在專案目錄下的 `app.sqlite3`。

## 執行需求

- Python 3.9 以上
- 瀏覽器
- 若要使用 AI 對話功能，需安裝並啟動 Ollama

## 啟動方式

### 1. 進入專案資料夾

```bash
cd embedded-system-notebook
```

### 2. 啟動 Ollama

請先確認 Ollama 已在本機執行，預設位址為：

```text
http://127.0.0.1:11434
```

### 3. 啟動伺服器

```bash
python server.py
```

### 4. 開啟網頁

終端機會顯示可用網址。預設會提供：

```text
http://127.0.0.1:PORT/
```

如果你要讓區網內其他裝置連線，可以把環境變數 `HOST` 設成 `0.0.0.0`，再用這台電腦的區網 IP 連入。

## 內建範例

- `LED Blink`
- `LED Chaser`
- `Button Controls LED`
- `Servo Sweep`
- `Ultrasonic Distance`
- `DHT Temperature and Humidity`

## 後端 API

- `GET /api/ollama/models`：取得本機 Ollama 模型清單
- `POST /api/ollama/chat`：轉發聊天請求到 Ollama
- `GET /api/uploads`：列出已上傳檔案
- `POST /api/uploads`：上傳檔案並寫入 SQLite
- `GET /api/uploads/<id>/download`：下載指定檔案

## 專案結構

```text
embedded-system-notebook/
├─ index.html
├─ styles.css
├─ app.js
├─ server.py
├─ README.md
└─ app.sqlite3
```

## 常見問題

### 1. AI 對話無法連線

- 確認 Ollama 已啟動
- 確認模型已安裝
- 確認 `http://127.0.0.1:11434` 可正常存取

### 2. 上傳後看不到檔案

- 確認後端伺服器正在執行
- 重新整理頁面
- 檢查 `app.sqlite3` 是否有寫入權限

### 3. 想讓其他裝置連進來

- 將 `HOST` 設成 `0.0.0.0`
- 確認防火牆放行該埠號
- 用這台電腦的區網 IP 開啟頁面

## 備註

這個專案目前以本機使用為主；筆記仍保存在瀏覽器本機，上傳檔案則保存在 SQLite。若要跨裝置同步，後續可以再把筆記也改成資料庫或雲端儲存。

