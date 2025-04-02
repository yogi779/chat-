// back.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const rooms = {}; // Store chat rooms

// On connection
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a room
    socket.on('joinRoom', (roomName) => {
        if (!rooms[roomName]) {
            rooms[roomName] = { users: [] };
        }

        rooms[roomName].users.push(socket.id);
        socket.join(roomName);
        console.log(`${socket.id} joined room: ${roomName}`);

        // Notify other users in the room
        io.to(roomName).emit('roomUsers', rooms[roomName].users);
    });

    // Receive a message and broadcast to room
    socket.on('sendMessage', (data) => {
        io.to(data.room).emit('receiveMessage', {
            user: socket.id,
            message: data.message
        });
    });

    // User disconnects
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        // Remove user from all rooms
        for (const roomName in rooms) {
            rooms[roomName].users = rooms[roomName].users.filter(user => user !== socket.id);
        }
    });
});

// Starting the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
