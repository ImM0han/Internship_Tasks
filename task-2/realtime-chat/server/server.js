const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.send("Socket.IO Chat Server Running ✅"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // for internship demo; lock this for production
    methods: ["GET", "POST"]
  }
});

// In-memory user store (fine for internship deliverable)
const users = new Map(); // socketId -> { username, room }

function getUsersInRoom(room) {
  const list = [];
  for (const [, u] of users) {
    if (u.room === room) list.push(u.username);
  }
  // unique + sorted
  return [...new Set(list)].sort((a, b) => a.localeCompare(b));
}

io.on("connection", (socket) => {
  // Join room
  socket.on("join", ({ username, room }) => {
    if (!username || !room) return;

    const cleanUser = String(username).trim().slice(0, 24);
    const cleanRoom = String(room).trim().slice(0, 24);

    users.set(socket.id, { username: cleanUser, room: cleanRoom });
    socket.join(cleanRoom);

    // notify others
    socket.to(cleanRoom).emit("system", {
      text: `${cleanUser} joined`,
      at: Date.now()
    });

    // send room user list to everyone in room
    io.to(cleanRoom).emit("room_users", {
      room: cleanRoom,
      users: getUsersInRoom(cleanRoom)
    });
  });

  // Message event
  socket.on("message", ({ text }) => {
    const u = users.get(socket.id);
    if (!u || !text) return;

    const msg = String(text).trim();
    if (!msg) return;

    io.to(u.room).emit("message", {
      username: u.username,
      text: msg.slice(0, 2000),
      at: Date.now()
    });
  });

  // Typing indicator
  socket.on("typing", (isTyping) => {
    const u = users.get(socket.id);
    if (!u) return;
    socket.to(u.room).emit("typing", {
      username: u.username,
      isTyping: Boolean(isTyping)
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    const u = users.get(socket.id);
    if (!u) return;

    users.delete(socket.id);

    socket.to(u.room).emit("system", {
      text: `${u.username} left`,
      at: Date.now()
    });

    io.to(u.room).emit("room_users", {
      room: u.room,
      users: getUsersInRoom(u.room)
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
