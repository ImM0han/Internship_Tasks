// Change this if your backend runs on a different host/port
const API_URL = "http://localhost:5000";
document.getElementById("apiUrl").textContent = API_URL;

const socket = io(API_URL, { transports: ["websocket"] });

const joinCard = document.getElementById("joinCard");
const chatCard = document.getElementById("chatCard");

const joinForm = document.getElementById("joinForm");
const usernameEl = document.getElementById("username");
const roomEl = document.getElementById("room");
const roomLabel = document.getElementById("roomLabel");

const usersWrap = document.getElementById("users");

const messagesWrap = document.getElementById("messages");
const msgForm = document.getElementById("msgForm");
const msgInput = document.getElementById("msg");

const typingEl = document.getElementById("typing");

let myUsername = "";
let myRoom = "";
let typingTimeout = null;

function fmtTime(ts){
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function scrollBottom(){
  messagesWrap.scrollTop = messagesWrap.scrollHeight;
}

function addSystem(text){
  const div = document.createElement("div");
  div.className = "system";
  div.textContent = text;
  messagesWrap.appendChild(div);
  scrollBottom();
}

function addMessage({ username, text, at }){
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `
    <div class="meta"><b>${escapeHtml(username)}</b> • ${fmtTime(at)}</div>
    <div class="text">${escapeHtml(text)}</div>
  `;
  messagesWrap.appendChild(div);
  scrollBottom();
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setUsers(list){
  usersWrap.innerHTML = "";
  for(const u of list){
    const pill = document.createElement("span");
    pill.className = "userPill";
    pill.textContent = u;
    usersWrap.appendChild(pill);
  }
}

joinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = usernameEl.value.trim();
  const room = roomEl.value.trim();
  if(!username || !room) return;

  myUsername = username.slice(0, 24);
  myRoom = room.slice(0, 24);

  socket.emit("join", { username: myUsername, room: myRoom });

  joinCard.classList.add("hidden");
  chatCard.classList.remove("hidden");
  roomLabel.textContent = `Room: ${myRoom}`;
  addSystem(`You joined as ${myUsername}`);
  msgInput.focus();
});

msgForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if(!text) return;

  socket.emit("message", { text });
  msgInput.value = "";
  socket.emit("typing", false);
});

msgInput.addEventListener("input", () => {
  socket.emit("typing", true);
  if(typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit("typing", false), 700);
});

// Incoming events
socket.on("message", (payload) => {
  addMessage(payload);
});

socket.on("system", ({ text }) => {
  addSystem(text);
});

socket.on("room_users", ({ room, users }) => {
  if(room === myRoom) setUsers(users);
});

socket.on("typing", ({ username, isTyping }) => {
  // Don’t show your own typing
  if(username === myUsername) return;
  typingEl.textContent = isTyping ? `${username} is typing…` : "";
});
