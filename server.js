const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { db } = require("./firebase");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

/* Health check */
app.get("/", (req, res) => {
    res.send("🚀 Group Chat Backend Running");
});

/* Get messages (REST API backup) */
app.get("/messages", async (req, res) => {
    try {
        const snapshot = await db.collection("messages").orderBy("time").get();
        const messages = snapshot.docs.map(doc => doc.data());
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* Socket connection */
io.on("connection", async (socket) => {

    console.log("User Connected:", socket.id);

    try {
        /* Send chat history from Firebase */
        const snapshot = await db.collection("messages").orderBy("time").get();
        const messages = snapshot.docs.map(doc => doc.data());

        socket.emit("chat_history", messages);

    } catch (err) {
        console.log("History load error:", err.message);
    }

    /* Receive message */
    socket.on("send_message", async (data) => {

        const message = {
            user: data.user,
            text: data.text,
            time: Date.now()
        };

        try {
            /* Save to Firebase */
            await db.collection("messages").add(message);

            /* Broadcast to all users */
            io.emit("receive_message", message);

            console.log("Message:", message);

        } catch (err) {
            console.log("Send error:", err.message);
        }
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected:", socket.id);
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
