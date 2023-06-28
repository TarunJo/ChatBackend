const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const messageRoute = require("./routes/messagesRoute");
const socket = require("socket.io");

app.options('*', (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'https://chat-frontend-ruddy.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Respond with a 200 status for preflight requests
    res.sendStatus(200);
});

mongoose.set('strictQuery', false);

dotenv.config();
app.use(cors()); // Use the CORS middleware

app.use(express.json());

app.use("/api/auth", userRoutes);
app.use("/api/message", messageRoute);

app.get("/", (req, res) => {
    res.send("Backend working");
});

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("DB Connection Successful!");
    } catch (err) {
        console.log(err);
    }
};

connect().then(() => {
    const server = app.listen(process.env.PORT, () => {
        console.log(`Server started on Port ${process.env.PORT}`);
    });

    const io = socket(server, {
        cors: {
            origin: "*",
            credentials: true
        }
    });

    // Store all online users inside this map
    global.onlineUsers = new Map();

    io.on("connection", (socket) => {
        global.chatSocket = socket;
        socket.on("add-user", (userId) => {
            onlineUsers.set(userId, socket.id);
        });

        socket.on("send-msg", (data) => {
            const sendUserSocket = onlineUsers.get(data.to);
            if (sendUserSocket) {
                socket.to(sendUserSocket).emit("msg-recieved", data.message);
            }
        });
    });
}).catch((err) => {
    console.log(err);
});
