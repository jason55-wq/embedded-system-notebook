# Arduino Sample Code Notebook

這個專案是一個給 Arduino 初學者與專題練習使用的小型範例平台，整合了「筆記管理」、「Arduino 程式碼產生」與「常見除錯提示」三個功能。你可以直接在瀏覽器中整理開發筆記、切換不同 sample code 類型，並快速取得可貼進 Arduino IDE 的 `.ino` 範例內容。

## 專案特色

- 用網頁介面整理 Arduino 學習筆記
- 內建多種常見 Arduino sample code 模板
- 可依專案類型、板子型號、腳位設定產生程式
- 提供常見錯誤關鍵字的快速除錯建議
- 使用純前端加上簡單 Python 靜態伺服器，容易執行與修改

## 目前包含的 Sample Code

這個專案目前內建 6 種 Arduino sample code：

### 1. LED Blink

最基本的 LED 閃爍範例，會讓 LED 以固定頻率亮滅。適合用來確認板子、上傳流程與輸出腳位是否正常。

- 預設腳位：`13`
- 適合練習：`pinMode()`、`digitalWrite()`、`delay()`

### 2. LED Chaser

多顆 LED 依序流動點亮的跑馬燈範例，支援從輸入欄位解析多個 LED 腳位設定。

- 預設腳位：`8, 9, 10, 11`
- 可輸入格式：`LEDS=8,9,10,11`
- 適合練習：陣列、迴圈、控制多個輸出腳位

### 3. Button Controls LED

按下按鈕時點亮 LED，並透過序列埠輸出訊息。這是很常見的數位輸入入門範例。

- 預設 LED 腳位：`13`
- 預設按鈕腳位：`2`
- 使用：`INPUT_PULLUP`
- 適合練習：按鈕讀值、上拉輸入、基本互動控制

### 4. Servo Sweep

控制伺服馬達在 `0` 到 `180` 度之間來回擺動，展示伺服元件的基本操作方式。

- 預設伺服腳位：`9`
- 使用函式庫：`Servo.h`
- 適合練習：伺服控制、角度設定、函式庫整合

### 5. Ultrasonic Distance

使用超音波感測器量測距離，並透過序列埠輸出公分數值。

- 預設 `TRIG` 腳位：`9`
- 預設 `ECHO` 腳位：`10`
- 適合練習：感測器觸發、脈衝時間量測、距離換算

### 6. DHT Temperature and Humidity

讀取 DHT11 感測器的溫度與濕度資料，並將結果輸出到序列埠。

- 預設感測器腳位：`2`
- 使用函式庫：`DHT.h`
- 預設型號：`DHT11`
- 適合練習：環境感測、函式庫初始化、資料讀取失敗判斷

## 網頁功能介紹

### Arduino Notebook

筆記區可以讓你記錄：

- 專題名稱
- 標籤
- 接線方式
- 感測器用途
- 測試結果
- 問題排查紀錄

筆記資料會儲存在瀏覽器的 `localStorage`，重新整理頁面後仍會保留。

### Code Builder

Code Builder 是這個專案的核心功能，可以根據使用者輸入快速產生 Arduino 範例程式。

可設定內容包括：

- 專案類型
- 板子型號：`Arduino Uno`、`Arduino Nano`、`Arduino Mega`
- 腳位設定
- 額外需求描述

產生結果會直接顯示在文字區塊中，方便複製到 Arduino IDE 測試。

### Debug Assistant

除錯區目前支援針對幾類常見關鍵字給出快速說明，例如：

- `avrdude`
- 按鈕沒反應
- LED 不亮

這一區適合做成未來更完整 AI 助手或錯誤知識庫的基礎版本。

## 檔案說明

- [index.html](</c:/Users/ASUS/Desktop/python codex/embedded system notebook/index.html>)：主畫面結構，包含筆記區、Code Builder 與除錯區
- [styles.css](</c:/Users/ASUS/Desktop/python codex/embedded system notebook/styles.css>)：整體版面與元件樣式
- [app.js](</c:/Users/ASUS/Desktop/python codex/embedded system notebook/app.js>)：筆記儲存、sample code 產生與除錯提示邏輯
- [server.py](</c:/Users/ASUS/Desktop/python codex/embedded system notebook/server.py>)：本機靜態伺服器，啟動後會自動開啟網頁

## 如何執行

在專案目錄執行：

```bash
python server.py
```

啟動後可在瀏覽器開啟：

```text
http://127.0.0.1:8000/index.html
```

## 適合的使用情境

- Arduino 課堂作業整理
- 感測器與控制元件基礎練習
- 專題前期的 sample code 快速建立
- 教學展示用的小型互動平台
- 做為未來串接 AI 產碼或專案管理功能的雛形

## 後續可擴充方向

- 加入更多 sample code 類型，例如 `OLED`、`RFID`、`Buzzer`、`I2C`
- 支援匯出 `.ino` 或 `.txt`
- 串接 OpenAI API 產生更客製化的 Arduino 程式
- 增加接線圖、元件清單與教學說明區
- 將除錯助手改成可對話式問答介面
