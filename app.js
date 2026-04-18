const notesKey = "arduino-notebook-notes";

const noteTitle = document.getElementById("noteTitle");
const noteTags = document.getElementById("noteTags");
const noteBody = document.getElementById("noteBody");
const notesList = document.getElementById("notesList");
const saveStatus = document.getElementById("saveStatus");
const generatedCode = document.getElementById("generatedCode");
const ollamaModel = document.getElementById("ollamaModel");
const chatPrompt = document.getElementById("chatPrompt");
const chatLog = document.getElementById("chatLog");
const chatStatus = document.getElementById("chatStatus");
const chatSendBtn = document.getElementById("chatSendBtn");
const chatClearBtn = document.getElementById("chatClearBtn");

const ollamaSystemPrompt = "你是一位專注於 Arduino、嵌入式系統、感測器與除錯的本機 AI 助手。請用繁體中文回答，必要時用條列與範例程式碼說明。";
const chatState = {
  messages: [{ role: "system", content: ollamaSystemPrompt }]
};

document.getElementById("saveNotesBtn").addEventListener("click", saveNote);
document.getElementById("clearNotesBtn").addEventListener("click", clearNotes);
document.getElementById("generateCodeBtn").addEventListener("click", buildCode);
document.getElementById("debugBtn").addEventListener("click", answerDebugPrompt);
chatSendBtn.addEventListener("click", sendChatMessage);
chatClearBtn.addEventListener("click", resetChat);
chatPrompt.addEventListener("keydown", handleChatKeydown);

renderNotes();
buildCode();
renderChat();
loadOllamaModels();

function loadNotes() {
  const raw = localStorage.getItem(notesKey);
  return raw ? JSON.parse(raw) : [];
}

function persistNotes(notes) {
  localStorage.setItem(notesKey, JSON.stringify(notes));
}

function saveNote() {
  const title = noteTitle.value.trim();
  const tags = noteTags.value.trim();
  const body = noteBody.value.trim();

  if (!title || !body) {
    saveStatus.textContent = "請至少填寫標題與內容。";
    return;
  }

  const notes = loadNotes();
  notes.unshift({
    id: Date.now(),
    title,
    tags,
    body,
    createdAt: new Date().toLocaleString("zh-TW")
  });

  persistNotes(notes);
  renderNotes();

  noteTitle.value = "";
  noteTags.value = "";
  noteBody.value = "";
  saveStatus.textContent = "筆記已成功儲存。";
}

function clearNotes() {
  localStorage.removeItem(notesKey);
  renderNotes();
  saveStatus.textContent = "所有筆記都已清除。";
}

function renderNotes() {
  const notes = loadNotes();

  if (!notes.length) {
    notesList.innerHTML = "<p class='note-meta'>目前還沒有筆記，先新增一筆試試看。</p>";
    return;
  }

  notesList.innerHTML = notes.map((note) => `
    <article class="note-card">
      <h3>${escapeHtml(note.title)}</h3>
      <p class="note-meta">標籤：${escapeHtml(note.tags || "無")} | 建立時間：${escapeHtml(note.createdAt)}</p>
      <p>${escapeHtml(note.body).replace(/\n/g, "<br>")}</p>
    </article>
  `).join("");
}

function buildCode() {
  const projectType = document.getElementById("projectType").value;
  const boardType = document.getElementById("boardType").value;
  const pinConfig = document.getElementById("pinConfig").value.trim();
  const extraGoal = document.getElementById("extraGoal").value.trim();

  const boardComment = `// Board: ${labelForBoard(boardType)}`;
  const configComment = pinConfig ? `// Pin config: ${pinConfig}` : "// Pin config: use defaults below";
  const extraComment = extraGoal ? `// Extra goal: ${extraGoal}` : "// Extra goal: none";

  let code = "";

  switch (projectType) {
    case "blink":
      code = `${boardComment}
${configComment}
${extraComment}

const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);
}`;
      break;
    case "led_chaser": {
      const ledPins = parseLedPins(pinConfig);
      const pinList = ledPins.join(", ");
      code = `${boardComment}
${configComment}
${extraComment}

const int LED_PINS[] = {${pinList}};
const int LED_COUNT = sizeof(LED_PINS) / sizeof(LED_PINS[0]);
const int STEP_DELAY = 120;

void setup() {
  for (int i = 0; i < LED_COUNT; i++) {
    pinMode(LED_PINS[i], OUTPUT);
  }
}

void lightOneLed(int activeIndex) {
  for (int i = 0; i < LED_COUNT; i++) {
    digitalWrite(LED_PINS[i], i == activeIndex ? HIGH : LOW);
  }
}

void loop() {
  for (int i = 0; i < LED_COUNT; i++) {
    lightOneLed(i);
    delay(STEP_DELAY);
  }

  for (int i = LED_COUNT - 2; i > 0; i--) {
    lightOneLed(i);
    delay(STEP_DELAY);
  }
}`;
      break;
    }
    case "button_led":
      code = `${boardComment}
${configComment}
${extraComment}

const int LED_PIN = 13;
const int BUTTON_PIN = 2;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);

  if (buttonState == LOW) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Button pressed");
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  delay(30);
}`;
      break;
    case "servo":
      code = `${boardComment}
${configComment}
${extraComment}

#include <Servo.h>

Servo myServo;
const int SERVO_PIN = 9;

void setup() {
  myServo.attach(SERVO_PIN);
}

void loop() {
  for (int angle = 0; angle <= 180; angle += 10) {
    myServo.write(angle);
    delay(200);
  }

  for (int angle = 180; angle >= 0; angle -= 10) {
    myServo.write(angle);
    delay(200);
  }
}`;
      break;
    case "ultrasonic":
      code = `${boardComment}
${configComment}
${extraComment}

const int TRIG_PIN = 9;
const int ECHO_PIN = 10;

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  float distanceCm = duration * 0.0343 / 2.0;

  Serial.print("Distance: ");
  Serial.print(distanceCm);
  Serial.println(" cm");
  delay(500);
}`;
      break;
    case "dht":
      code = `${boardComment}
${configComment}
${extraComment}

#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor");
    delay(1000);
    return;
  }

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.print("%  Temperature: ");
  Serial.print(temperature);
  Serial.println(" C");
  delay(2000);
}`;
      break;
  }

  generatedCode.value = code;
}

function answerDebugPrompt() {
  const input = document.getElementById("debugPrompt").value.trim().toLowerCase();
  const answer = document.getElementById("debugAnswer");

  if (!input) {
    answer.textContent = "請先輸入你遇到的錯誤訊息或症狀。";
    return;
  }

  if (input.includes("avrdude") || input.includes("com port")) {
    answer.textContent = "先確認選到正確的 COM Port，並檢查 USB 線是否可傳輸資料；若序列埠被其他程式佔用，也會造成上傳失敗。";
    return;
  }

  if (input.includes("按鈕") || input.includes("button")) {
    answer.textContent = "按鈕不穩定通常與接線或彈跳效應有關，建議使用 INPUT_PULLUP，並在程式中加入簡單 debounce 邏輯。";
    return;
  }

  if (input.includes("led") || input.includes("燈不亮")) {
    answer.textContent = "請先確認 LED 正負極方向、限流電阻，以及程式中的腳位編號是否和實際接線一致。";
    return;
  }

  answer.textContent = "可以先從三個方向檢查：1. 接線是否正確。2. 板子與連接埠設定是否正確。3. 錯誤訊息是否指出特定模組或函式。";
}

function handleChatKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage();
  }
}

function resetChat() {
  chatState.messages = [{ role: "system", content: ollamaSystemPrompt }];
  chatPrompt.value = "";
  chatStatus.textContent = "已清除對話。";
  renderChat();
}

async function sendChatMessage() {
  const content = chatPrompt.value.trim();

  if (!content) {
    chatStatus.textContent = "請先輸入要詢問 Ollama 的內容。";
    return;
  }

  const model = ollamaModel.value.trim();
  const userMessage = { role: "user", content };
  const assistantMessage = { role: "assistant", content: "正在思考中..." };

  chatState.messages.push(userMessage, assistantMessage);
  chatPrompt.value = "";
  chatStatus.textContent = "正在連線到本機 Ollama...";
  chatSendBtn.disabled = true;
  renderChat();

  try {
    const response = await fetch("/api/ollama/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...(model ? { model } : {}),
        messages: chatState.messages.slice(0, -1)
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || payload.message || "Ollama 回傳了錯誤。");
    }

    assistantMessage.content = payload?.message?.content || payload?.response || "Ollama 沒有回傳內容。";
    chatStatus.textContent = "已收到回覆。";
  } catch (error) {
    assistantMessage.content = `無法連線到 Ollama：${error.message}`;
    chatStatus.textContent = "聊天失敗，請確認 Ollama 已啟動。";
  } finally {
    chatSendBtn.disabled = false;
    renderChat();
  }
}

async function loadOllamaModels() {
  try {
    const response = await fetch("/api/ollama/models");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Failed to load Ollama models.");
    }

    const models = Array.isArray(payload.models) ? payload.models : [];
    if (!models.length) {
      return;
    }

    const currentValue = ollamaModel.value.trim();
    if (!currentValue || !models.includes(currentValue)) {
      ollamaModel.value = models[0];
      chatStatus.textContent = `已自動選用本機模型：${models[0]}`;
    }
  } catch (error) {
    if (!ollamaModel.value.trim()) {
      chatStatus.textContent = `無法讀取本機模型清單：${error.message}`;
    }
  }
}

function renderChat() {
  const visibleMessages = chatState.messages.filter((message) => message.role !== "system");

  if (!visibleMessages.length) {
    chatLog.innerHTML = `
      <p class="chat-empty">還沒有對話。先輸入問題，這裡會顯示你和 Ollama 的聊天內容。</p>
    `;
    return;
  }

  chatLog.innerHTML = visibleMessages.map((message) => {
    const isUser = message.role === "user";
    const speaker = isUser ? "你" : "Ollama";
    const roleClass = isUser ? "user" : "assistant";
    const content = escapeHtml(message.content).replace(/\n/g, "<br>");

    return `
      <article class="chat-message ${roleClass}">
        <div class="chat-message-meta">
          <span>${speaker}</span>
          <span>${isUser ? "使用者" : "AI 回覆"}</span>
        </div>
        <div class="chat-message-content">${content}</div>
      </article>
    `;
  }).join("");

  chatLog.scrollTop = chatLog.scrollHeight;
}

function labelForBoard(boardType) {
  switch (boardType) {
    case "nano":
      return "Arduino Nano";
    case "mega":
      return "Arduino Mega";
    default:
      return "Arduino Uno";
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseLedPins(pinConfig) {
  const match = pinConfig.match(/LEDS?\s*=\s*([\d,\s]+)/i);

  if (!match) {
    return [8, 9, 10, 11];
  }

  const pins = match[1]
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isInteger(value));

  return pins.length >= 2 ? pins : [8, 9, 10, 11];
}
