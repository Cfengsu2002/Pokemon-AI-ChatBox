const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const express = require("express");
const cors = require("cors"); 
const app = express();
const http = require("http");
const { Server } = require("socket.io");

app.use(cors()); 
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
  },
});


app.use(express.static("public"));

io.on("connection", async (socket) => {
  console.log(`${socket.id} connected.`);

  try {
    const snapshot = await db.collection("messages")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const recentMessages = snapshot.docs.map(doc => {
      const msg = doc.data();
      return { handle: msg.username, message: msg.message };
    }).reverse();

    console.log(`📜 Loaded ${recentMessages.length} recent messages.`);
    recentMessages.forEach((msg) => socket.emit("chatMessage", msg));
  } catch (error) {
    console.error("Error fetching recent messages:", error);
  }

  socket.on("chatMessage", async (data) => {
    if (!socket.username) {
      socket.username = data.handle;
      io.emit("systemMessage", `${socket.username} has joined the chat.`);
    }

    console.log(`${data.handle}: ${data.message}`);

    try {
      await db.collection("messages").add({
        username: data.handle,
        message: data.message,
        timestamp: Date.now(),
      });
      io.emit("chatMessage", data);
    } catch (error) {
      console.error("Error saving message to Firestore:", error);
    }
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      io.emit("systemMessage", `${socket.username} has left the chat.`);
      console.log(`${socket.username} disconnected.`);
    }
  });
});

const PORT = 4000;
server.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
