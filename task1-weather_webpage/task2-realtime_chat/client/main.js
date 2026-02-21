import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:5000";
const socket = io(SERVER_URL, { transports: ["websocket"] });

const joinScreen = document.getElementById("joinScreen");
const chatScreen = document.getElementById("chatScreen");
const joinForm = document.getElementById("joinForm");

const nameInput = document.getElementById("name");
const roomInput = document.getElementById("room");
const roomInfo = document.getElementById("roomInfo");

const usersEl = document.getElementById("users");
const messagesEl = document.getElementById("messages");
const typingEl = document.getElementById("typing");

const msgForm = document.getElementById("msgForm");
const msgInput = document.getElementById("msg");

let myName = "";
let myRoom = "";

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function addMessage({ name, text, time }, isSystem = false){
  const div = document.createElement("div");
  div.className = "msg" + (isSystem ? " system" : "");

  const t = time ? new Date(time) : new Date();
  const timeStr = t.toLocaleTimeString(undefined, { hour:"2-digit", minute:"2-digit" });

  div.innerHTML = `
    <div class="meta">
      <span class="name">${escapeHtml(name)}</span>
      <span>${timeStr}</span>
    </div>
    <div class="text">${escapeHtml(text)}</div>
  `;

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addSystem(text){
  addMessage({ name:"System", text, time: new Date().toISOString() }, true);
}

function renderUsers(list){
  usersEl.innerHTML = "";
  list.forEach(u => {
    const chip = document.createElement("div");
    chip.className = "user";
    chip.textContent = u;
    usersEl.appendChild(chip);
  });
}

joinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  myName = nameInput.value.trim();
  myRoom = roomInput.value.trim() || "general";

  if (!myName) return;

  socket.emit("join", { name: myName, room: myRoom });

  joinScreen.hidden = true;
  chatScreen.hidden = false;
  roomInfo.textContent = `Room: ${myRoom}`;

  msgInput.focus();
});

msgForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text) return;

  socket.emit("message", { text });
  msgInput.value = "";
  socket.emit("typing", false);
});

let typingTimer = null;
msgInput.addEventListener("input", () => {
  socket.emit("typing", msgInput.value.trim().length > 0);

  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => socket.emit("typing", false), 800);
});

/* ---- Socket events ---- */
socket.on("system", ({ msg }) => addSystem(msg));

socket.on("message", (payload) => addMessage(payload));

socket.on("roomUsers", ({ room, users }) => {
  if (room) roomInfo.textContent = `Room: ${room}`;
  renderUsers(users || []);
});

let typingSet = new Set();
socket.on("typing", ({ name, isTyping }) => {
  if (!name || name === myName) return;

  if (isTyping) typingSet.add(name);
  else typingSet.delete(name);

  typingEl.textContent =
    typingSet.size ? `${Array.from(typingSet).join(", ")} typing...` : "";
});
