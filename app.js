const notesKey = "arduino-notebook-notes";

const noteTitle = document.getElementById("noteTitle");
const noteTags = document.getElementById("noteTags");
const noteBody = document.getElementById("noteBody");
const notesList = document.getElementById("notesList");
const saveStatus = document.getElementById("saveStatus");
const generatedCode = document.getElementById("generatedCode");

document.getElementById("saveNotesBtn").addEventListener("click", saveNote);
document.getElementById("clearNotesBtn").addEventListener("click", clearNotes);
document.getElementById("generateCodeBtn").addEventListener("click", buildCode);
document.getElementById("debugBtn").addEventListener("click", answerDebugPrompt);

renderNotes();
buildCode();

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
    saveStatus.textContent = "請至少填入主題和內容。";
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
  saveStatus.textContent = "筆記已儲存到本機瀏覽器。";
}

function clearNotes() {
  localStorage.removeItem(notesKey);
  renderNotes();
  saveStatus.textContent = "所有筆記已清空。";
}

function renderNotes() {
  const notes = loadNotes();

  if (!notes.length) {
    notesList.innerHTML = "<p class='note-meta'>目前還沒有筆記，先記下你的第一個模組測試吧。</p>";
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
    answer.textContent = "先輸入你目前遇到的現象，我會提供對應的排查方向。";
    return;
  }

  if (input.includes("avrdude") || input.includes("上傳")) {
    answer.textContent = "先檢查板型與 COM Port 是否正確，再確認 USB 線可傳輸資料。若序列監控器開著，也請先關閉後重試。";
    return;
  }

  if (input.includes("亂跳") || input.includes("不穩")) {
    answer.textContent = "這通常和供電、接地、浮接輸入或取樣雜訊有關。先確認共地、加上上拉/下拉，再用平均值或 debounce 減少抖動。";
    return;
  }

  if (input.includes("沒有反應") || input.includes("沒亮")) {
    answer.textContent = "優先確認腳位編號、元件方向、共地，以及 setup() 中是否有正確設定 pinMode。再用最小測試程式逐步驗證。";
    return;
  }

  answer.textContent = "建議先從三個方向排查：1. 接線與供電 2. 板型與腳位設定 3. 用最小可運作範例逐步測試。之後我們也可以把這裡升級成真正的 AI 問答助手。";
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
