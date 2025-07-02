import { Server, Socket } from "socket.io";

export const activeDoctors = new Map();

export const handleConnection = (io: Server, socket: Socket) => {
    //console.log('New client connected:', socket.id);

    socket.on('join_room', (user) => {
        if (user?.id && user?.userRole) {
            const personalRoom = `${user.userRole}_${user.id}`;
            const roleRoom = `${user.userRole}s`;
            socket.join([personalRoom, roleRoom]);
            console.log('user joined ', personalRoom, roleRoom)
        }
    });

    socket.on('disconnect', () => {
        socket.disconnect(true);
        console.log('Client disconnected:', socket.id);
    });
};