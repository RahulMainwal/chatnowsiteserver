const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const bodyParser = require("body-parser");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(bodyParser.json()).use(cors());
app.use("/public", express.static("public"));

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.get("/", (req, res) => {
  res.json("Hello, Server has connected! 👋");
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
const io = socket(server, {
  cors: {
    origin: ['https://chatnowsite.vercel.app:*', 'https://chatnowsite.vercel.app:*'],
    // origin: "*",
    credentials: true,
  },
});

let activeUsers = [];

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("get-online-users", activeUsers);
    if (!activeUsers.some((user) => user.userId === userId)) {
      activeUsers.push({
        userId,
        socketId: socket.id,
      });
    }
    // console.log(activeUsers);
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-online-users", activeUsers);
    // console.log(activeUsers);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      io.emit("msg-recieve", data.msg);
    }
  });
});
