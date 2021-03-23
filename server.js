require('dotenv').config()
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const path = require('path');

const rooms = {};

io.on("connection", sock => {
    sock.on("join room", roomID => {
        if (rooms[roomID]) {
            rooms[roomID].push(sock.id);
        } else {
            rooms[roomID] = [sock.id];
        }
        const otherUser = rooms[roomID].find(id => id !== sock.id);
        if (otherUser) {
            sock.emit("other user", otherUser);
            sock.to(otherUser).emit("user joined", sock.id);
        }
    });

    sock.on("offer", payload => {
        io.to(payload.target).emit("offer", payload);
    });

    sock.on("answer", payload => {
        io.to(payload.target).emit("answer", payload);
    });

    sock.on("ice-candidate", incoming => {
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    });
});

if(process.env.PROD) {
    app.use(express.static(path.join(__dirname, './video-call-chat/build')));
    app.get('*', (req,res) => {
        res.sendFile(path.join(__dirname, './video-call-chat/build/index.html'))
    });
}

const port = process.env.PORT || 8000
server.listen(port, () => console.log(`server is running on port ${port}`));
