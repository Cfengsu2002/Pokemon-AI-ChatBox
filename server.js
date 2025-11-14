const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fir-project-5741f-default-rtdb.firebaseio.com"
});

const db = admin.firestore();     
const rtdb = admin.database();     
const { Ollama } = require("ollama");

const ollama = new Ollama({
  host: "http://localhost:11434"
});

const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const { Server } = require("socket.io");

app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

async function getLast10Messages() {
  const snapshot = await db.collection("messages")
    .orderBy("timestamp", "desc")
    .limit(10)
    .get();

  return snapshot.docs
    .map(doc => doc.data().message)
    .reverse()
    .join("\n");
}

async function getEnvironmentData() {
  const paths = {
    ledDigital: "LED/digital",
    ledAnalog: "LED/analog",
    button: "Button/state",
    ldr: "Sensor/ldr_data",
    servo: "Servo/angle"
  };

  let result = {};
  for (const key in paths) {
    const snap = await rtdb.ref(paths[key]).get();
    result[key] = snap.exists() ? snap.val() : null;
  }

  return result;
}

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

    recentMessages.forEach(msg => socket.emit("chatMessage", msg));
  } catch (error) {
    console.error("Error loading messages:", error);
  }

  socket.on("chatMessage", async (data) => {
    if (!socket.username) {
      socket.username = data.handle;
      io.emit("systemMessage", `${socket.username} joined the chat.`);
    }

    const msg = data.message.trim();
    console.log(`${data.handle}: ${msg}`);

    if (msg.toLowerCase() === "/summarize") {
      io.emit("systemMessage", `AI is summarizing...`);
      const lastMessages = await getLast10Messages();

      const response = await ollama.chat({
        model: "llama3.2",
        messages: [
          { role: "user", content: `Summarize this chat:\n${lastMessages}` }
        ]
      });

      io.emit("chatMessage", {
        handle: "AI",
        message: response.message.content
      });
      return;
    }

    if (msg.startsWith("/question")) {
      const question = msg.replace("/question", "").trim();

      const response = await ollama.chat({
        model: "llama3.2",
        messages: [{ role: "user", content: question }]
      });

      io.emit("chatMessage", {
        handle: "AI",
        message: response.message.content
      });
      return;
    }

    if (msg === "/environment") {
      io.emit("systemMessage", "AI reading environment data...");

      const env = await getEnvironmentData();

      const prompt = `
Here is my ESP32 IoT sensor data:

LED (digital): ${env.ledDigital}
LED brightness: ${env.ledAnalog}
Button state: ${env.button}
LDR light: ${env.ldr}
Servo angle: ${env.servo}

Please summarize the environment in natural language.
      `;

      const response = await ollama.chat({
        model: "llama3.2",
        messages: [{ role: "user", content: prompt }]
      });

      io.emit("chatMessage", {
        handle: "AI",
        message: response.message.content
      });
      return;
    }

    try {
      await db.collection("messages").add({
        username: data.handle,
        message: msg,
        timestamp: Date.now(),
      });
      io.emit("chatMessage", data);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      io.emit("systemMessage", `${socket.username} left the chat.`);
    }
  });
});

// Run server
const PORT = 4000;
server.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);