const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Configure CORS for production and development
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://vyorius-drones.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// In-memory task storage (fallback for demo without Supabase)
let tasks = [];
const userSockets = {}; // Track user sockets for targeted updates

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register user session with their ID
  socket.on("register:user", (userId) => {
    socket.userId = userId;
    if (!userSockets[userId]) {
      userSockets[userId] = [];
    }
    userSockets[userId].push(socket.id);
    console.log(`User ${userId} registered. Active sockets:`, userSockets[userId].length);

    // Send only this user's tasks
    const userTasks = tasks.filter((t) => t.userId === userId);
    socket.emit("sync:tasks", userTasks);
  });

  // Create a new task
  socket.on("task:create", (taskData) => {
    if (!socket.userId) {
      console.warn("Task creation received without user registration");
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      ...taskData,
      userId: socket.userId,
      column: taskData.column || "To Do",
      attachments: taskData.attachments || [],
    };
    tasks.push(newTask);
    // Broadcast only to this user's sockets
    emitToUser(socket.userId, "sync:tasks", tasks.filter((t) => t.userId === socket.userId));
    console.log("Task created for user:", socket.userId, newTask);
  });

  // Update an existing task
  socket.on("task:update", (taskData) => {
    if (!socket.userId) {
      console.warn("Task update received without user registration");
      return;
    }
    const taskIndex = tasks.findIndex((t) => t.id === taskData.id);
    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
      emitToUser(socket.userId, "sync:tasks", tasks.filter((t) => t.userId === socket.userId));
      console.log("Task updated for user:", socket.userId, tasks[taskIndex]);
    }
  });

  // Move a task between columns
  socket.on("task:move", (taskData) => {
    if (!socket.userId) {
      console.warn("Task move received without user registration");
      return;
    }
    const task = tasks.find((t) => t.id === taskData.id);
    if (task && task.userId === socket.userId) {
      task.column = taskData.column;
      emitToUser(socket.userId, "sync:tasks", tasks.filter((t) => t.userId === socket.userId));
      console.log("Task moved for user:", socket.userId, task);
    }
  });

  // Delete a task
  socket.on("task:delete", (taskId) => {
    if (!socket.userId) {
      console.warn("Task deletion received without user registration");
      return;
    }
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1 && tasks[taskIndex].userId === socket.userId) {
      tasks.splice(taskIndex, 1);
      emitToUser(socket.userId, "sync:tasks", tasks.filter((t) => t.userId === socket.userId));
      console.log("Task deleted for user:", socket.userId, taskId);
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId && userSockets[socket.userId]) {
      userSockets[socket.userId] = userSockets[socket.userId].filter(
        (id) => id !== socket.id
      );
      if (userSockets[socket.userId].length === 0) {
        delete userSockets[socket.userId];
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

// Helper function to emit to all of a user's socket connections
function emitToUser(userId, event, data) {
  if (userSockets[userId]) {
    userSockets[userId].forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log("Ready for Supabase database integration");
});
