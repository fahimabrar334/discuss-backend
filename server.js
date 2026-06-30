const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

/* Health check */
app.get("/", (req, res) => {
    res.send(`
        <h1>Group Chat Backend Running</h1>
        <p>Server Status: Online</p>
    `);
});

/* Store messages (temporary memory) */
let messages = [];

io.on("connection", (socket) => {

    console.log("User Connected:", socket.id);

    /* Send old messages to new user */
    socket.emit("chat_history", messages);

    /* Receive message */
    socket.on("send_message", (data) => {

        const message = {
            user: data.user,
            text: data.text,
            time: new Date().toLocaleTimeString()
        };

        messages.push(message);

        /* Keep last 200 messages */
        if (messages.length > 200) {
            messages.shift();
        }

        io.emit("receive_message", message);

        console.log(message);
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected:", socket.id);
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
