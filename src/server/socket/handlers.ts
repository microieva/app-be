import { Server, Socket } from "socket.io";

export const activeDoctors = new Map();

export const handleConnection = (io: Server, socket: Socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', (user) => {
        if (user?.id && user?.userRole) {
            const personalRoom = `${user.userRole}_${user.id}`;
            const roleRoom = `${user.userRole}s`;
            socket.join([personalRoom, roleRoom]);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        socket.disconnect();
    });
};