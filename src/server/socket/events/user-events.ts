import { Server, Socket } from "socket.io";

export const handleUserEvents = (io: Server, socket: Socket) => {
    socket.on('request_status', (id: number) => {
        const rooms = io.sockets.adapter.rooms;
        const online = Array.from(rooms.keys()).some(roomName => 
            roomName.endsWith(`_${id}`)
        );
        io.emit('USER_STATUS', { online });
    });
};