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

const rooms = {}; // Store chat rooms and users
const users = {}; // Store usernames by socket ID

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room with username
    socket.on('joinRoom', ({ room, username }) => {
        users[socket.id] = username;

        if (!rooms[room]) {
            rooms[room] = { users: [] };
        }

        rooms[room].users.push({ id: socket.id, name: username });
        socket.join(room);

        console.log(`${username} joined room: ${room}`);

        // Send updated user list
        const userList = rooms[room].users.map(user => user.name);
        io.to(room).emit('roomUsers', userList);
    });

    // Send message to room
    socket.on('sendMessage', ({ room, message }) => {
        const username = users[socket.id] || "Unknown";
        io.to(room).emit('receiveMessage', {
            user: username,
            message
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        const username = users[socket.id];

        for (const room in rooms) {
            rooms[room].users = rooms[room].users.filter(user => user.id !== socket.id);

            // Send updated user list to room
            const updatedUsers = rooms[room].users.map(user => user.name);
            io.to(room).emit('roomUsers', updatedUsers);
        }

        delete users[socket.id];
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
