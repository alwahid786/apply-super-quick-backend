// socket.js
import { Server } from "socket.io";
import { getEnv } from "../../configs/config.js";

const connectedUsers = new Map();
let io;
let isInitialized = false;

export const setupSocket = (server) => {
  if (isInitialized) return;

  io = new Server(server, {
    cors: {
      credentials: true,
      origin: [
        getEnv("FRONTEND_URL"),
        "https://apply-super-quick.vercel.app",
        "https://apply-super-quick-client.vercel.app",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  isInitialized = true;

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // 🔐 User must send userId immediately after connect
    socket.on("register_user", (userId) => {
      if (!userId) return;
      connectedUsers.set(userId, socket.id);
      console.log(`📌 User registered: ${userId} -> ${socket.id}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);

      // Remove user from map
      for (const [userId, sId] of connectedUsers.entries()) {
        if (sId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });

    socket.on("error", (err) => {
      console.error("⚠️ Socket error:", err);
    });
  });
};

// 🔁 Get io instance
export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

// 🎯 Emit to specific user by userId
export const emitToUser = (userId, event, data) => {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
    console.log(`📨 Emitted ${event} to ${userId} (${socketId})`);
  } else {
    console.log(`⚠️ No socket found for userId: ${userId}`);
  }
};
