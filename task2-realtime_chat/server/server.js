import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.send("Chat server is running ✅"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Track users per socket
const users = new Map(); // socketId -> { name, room }

function getRoomUsers(room) {
  const list = [];
  for (const u of users.values()) {
    if (u.room === room) list.push(u.name);
  }
  // unique + sorted
  return [...new Set(list)].sort((a, b) => a.localeCompare(b));
}

io.on("connection", (socket) => {
  // Join room
  socket.on("join", ({ name, room }) => {
    const cleanName = String(name || "").trim().slice(0, 20) || "Guest";
    const cleanRoom = String(room || "").trim().slice(0, 20) || "general";

    users.set(socket.id, { name: cleanName, room: cleanRoom });
    socket.join(cleanRoom);

    socket.emit("system", { msg: `Welcome, ${cleanName}!`, room: cleanRoom });

    socket.to(cleanRoom).emit("system", { msg: `${cleanName} joined the room.` });

    io.to(cleanRoom).emit("roomUsers", {
      room: cleanRoom,
      users: getRoomUsers(cleanRoom)
    });
  });

  // Chat message
  socket.on("message", ({ text }) => {
    const u = users.get(socket.id);
    if (!u) return;

    const msg = String(text || "").trim();
    if (!msg) return;

    io.to(u.room).emit("message", {
      name: u.name,
      text: msg,
      time: new Date().toISOString()
    });
  });

  // Typing indicator
  socket.on("typing", (isTyping) => {
    const u = users.get(socket.id);
    if (!u) return;
    socket.to(u.room).emit("typing", { name: u.name, isTyping: !!isTyping });
  });

  // Leave / disconnect
  socket.on("disconnect", () => {
    const u = users.get(socket.id);
    if (!u) return;

    users.delete(socket.id);
    socket.to(u.room).emit("system", { msg: `${u.name} left the room.` });

    io.to(u.room).emit("roomUsers", {
      room: u.room,
      users: getRoomUsers(u.room)
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
