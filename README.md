# Arduino 筆記與 Code 機器人

這是一個可直接在本機執行的 Arduino 學習工具，結合了筆記整理、常見程式範例產生，以及基本除錯建議，適合用來記錄模組測試、整理接線重點，或快速建立 Arduino 專案範例。

## 功能特色

- 整理 Arduino 筆記並儲存在瀏覽器本機
- 依常見專案類型快速產生範例程式
- 提供簡單的除錯排查建議
- 純 `HTML`、`CSS`、`JavaScript` 與 `Python`，不需要先安裝額外套件

## 專案檔案

- [index.html](</c:/Users/ASUS/Desktop/python codex/embedded system notebook/index.html>)：主頁面
- [styles.css](</c:/Users/ASUS/Desktop/python codex/embedded system notebook/styles.css>)：介面樣式
- [app.js](</c:/Users/ASUS/Desktop/python codex/embedded system notebook/app.js>)：前端互動與程式碼產生邏輯
- [server.py](</c:/Users/ASUS/Desktop/python codex/embedded system notebook/server.py>)：本機靜態伺服器

## 使用方式

### 方式一：直接開啟頁面

直接用瀏覽器打開 `index.html`。

### 方式二：使用本機伺服器

在專案資料夾中執行：

```bash
python server.py
```

接著在瀏覽器打開終端機顯示的網址，預設是：

```text
http://127.0.0.1:8000/index.html
```

## 操作說明

### 1. 筆記區

- 輸入主題、標籤與內容
- 點選「儲存筆記」後，資料會保存在瀏覽器 `localStorage`
- 可在下方查看已儲存的筆記

### 2. Code Builder

- 選擇專案類型，例如 `LED 閃爍`、`按鈕控制 LED`、`超音波測距`
- 選擇開發板
- 視需要填入腳位設定與額外需求
- 點選「產生程式碼」後，即可取得範例 Arduino 程式

### 3. 除錯助理

- 輸入像是 `avrdude 錯誤`、`按鈕亂跳`、`LED 沒亮` 這類問題
- 系統會提供基礎排查建議

## 適合的使用情境

- 記錄感測器接線方式與測試結果
- 整理每個 Arduino 模組的注意事項
- 快速產生作業、練習或展示用程式
- 在開發初期做簡單故障排查

## 後續可擴充方向

- 接上 OpenAI API，升級成真正的 AI Arduino 助手
- 匯出筆記為 `Markdown`、`JSON` 或 `.txt`
- 產生 `.ino` 檔案
- 增加更多模組與範例，例如 `OLED`、`RFID`、`藍牙`、`I2C`
- 加入搜尋、分類與收藏功能

## 備註

- 目前筆記資料儲存在本機瀏覽器中，不會自動同步到其他裝置
- 若清除瀏覽器網站資料，筆記也可能一併消失
