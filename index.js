const express = require("express");
const app = express(); 
const cors  = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const messageRoute = require("./routes/messagesRoute");
const socket = require("socket.io");
const cors = require("cors");

app.options('*', (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'https://chat-frontend-ruddy.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
    // Respond with a 200 status for preflight requests
    res.sendStatus(200);
  });  

const corsOptions = {
    origin: 'https://chat-frontend-ruddy.vercel.app' 
  };

mongoose.set('strictQuery', false);

dotenv.config();
app.use(cors(origin));
app.use(express.json());

app.use("/api/auth", userRoutes);
app.use("/api/message", messageRoute);

app.get("/", (req, res) => {
    res.send("Backend working");
});

//mongoose connection
// mongoose.connect(process.env.MONGO_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//     }).then(() => {
//         console.log("DB Connection Successful!")
//     }).catch((err) => console.log(err));

const connect = async () => {
    try{
        mongoose.connect(process.env.MONGO_URL);
        console.log("DB Connection Successful!");
    }
    catch(err){
        console.log(err);
    }
}

 const server = app.listen(process.env.PORT, async ()=>{
    await connect();
    console.log(`Server started on Port ${process.env.PORT}`);
});

const io = socket(server,{
    cors: {
        origin: "*",
        credentials: true,
    },
});

//store all online users inside this map
global.onlineUsers =  new Map();
 
io.on("connection",(socket)=>{
    global.chatSocket = socket;
    socket.on("add-user",(userId)=>{
        onlineUsers.set(userId,socket.id);
    });

    socket.on("send-msg",(data)=>{
        const sendUserSocket = onlineUsers.get(data.to);
        if(sendUserSocket) {
            socket.to(sendUserSocket).emit("msg-recieved",data.message);
        }
    });
});
