# Arduino Sample Code Notebook

一個專為 Arduino / 嵌入式初學者設計的本機網頁工具，結合了筆記管理、Arduino 範例程式產生器、常見除錯提示，以及可串接 Ollama 的 AI 對話助手。

這個專案不需要額外前端框架，直接用瀏覽器開啟即可使用；後端則由 `server.py` 提供靜態頁面與 Ollama API 代理。

## 專案特色

- 紀錄 Arduino 學習筆記，資料儲存在瀏覽器 `localStorage`
- 產生常見 Arduino 範例程式
- 支援多種板子設定，例如 `Arduino Uno`、`Arduino Nano`、`Arduino Mega`
- 提供基礎除錯提示，幫助處理常見問題
- 可連接本機 Ollama，做 Arduino 問題問答與程式協助

## 內建範例

目前可快速產生的範例包括：

- `LED Blink`
- `LED Chaser`
- `Button Controls LED`
- `Servo Sweep`
- `Ultrasonic Distance`
- `DHT Temperature and Humidity`

## 功能說明

### 1. Arduino 筆記

- 新增標題、標籤與內容
- 筆記會保存在瀏覽器本機，不需要登入或資料庫
- 可一鍵清除所有筆記

### 2. Code Builder

- 選擇專案類型
- 選擇開發板
- 輸入腳位設定，例如 `LED=13`、`BUTTON=2`、`LEDS=8,9,10,11`
- 可加入額外目標說明，讓範例程式更貼近需求

### 3. Debug Assistant

可輸入像這些關鍵字來獲得提示：

- `avrdude`
- `COM Port`
- `button`
- `LED`

### 4. Ollama AI 對話

- 透過 `server.py` 轉發到本機 Ollama
- 可指定模型名稱
- 若未指定模型，系統會優先使用第一個可用模型

## 技術架構

- 前端：`index.html`、`styles.css`、`app.js`
- 後端：`server.py`
- AI 模型：本機 `Ollama`

## 專案結構

```text
embedded-system-notebook/
├─ index.html
├─ styles.css
├─ app.js
├─ server.py
└─ README.md
```

## 執行需求

- Python 3.9 以上
- 瀏覽器
- 如果要使用 AI 對話功能，需先安裝並啟動 Ollama

## 安裝與啟動

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

伺服器啟動後，終端機會顯示網址，通常是：

```text
http://127.0.0.1:8000/
```

如果 `8000` 已被占用，程式會自動往後尋找可用的埠號。

## 使用方式

### 筆記區

1. 輸入標題
2. 輸入標籤
3. 寫下筆記內容
4. 按下儲存

### 程式產生器

1. 選擇專案類型
2. 選擇開發板型號
3. 填入腳位設定
4. 按下產生程式碼

### AI 對話區

1. 在 Ollama 模型欄位輸入模型名稱，或留空讓系統自動選擇
2. 輸入 Arduino 相關問題
3. 送出後由本機 Ollama 回覆

## 後端 API

這個專案的 Python 伺服器提供兩個 API：

- `GET /api/ollama/models`：取得本機 Ollama 可用模型
- `POST /api/ollama/chat`：轉發聊天請求到 Ollama

### `POST /api/ollama/chat` 範例

```json
{
  "model": "llama3.1",
  "messages": [
    { "role": "user", "content": "請幫我寫一個 LED Blink 範例" }
  ]
}
```

## 常見問題

### 1. 送出聊天後顯示無法連線 Ollama

請確認：

- Ollama 已啟動
- Ollama 正在執行於 `http://127.0.0.1:11434`
- 本機已安裝對應模型

### 2. 沒有顯示模型

如果 `/api/ollama/models` 沒有回傳模型，表示本機 Ollama 尚未安裝任何模型。

### 3. 筆記不見了

筆記是存在瀏覽器的 `localStorage`，如果你清除瀏覽器資料、換瀏覽器或換裝置，筆記就不會同步保留。

## 可再擴充的方向

- 新增更多 Arduino 範例模板，例如 `OLED`、`RFID`、`Buzzer`
- 支援匯出 `.ino` 檔
- 增加專案分類與搜尋功能
- 加入更完整的 AI Prompt 模板
- 將筆記改為雲端儲存

## 授權

如果你之後有打算公開這個專案，建議補上授權條款，例如 `MIT License`。

