import { Server, Socket } from "socket.io";
import { USER_STATUS } from "../../../graphql/constants";

export const handleUserEvents = (io: Server, socket: Socket) => {
    socket.on('request_status', (id: number) => {
        sendUserStatusUpdate(io, id);
    });
};

export const sendUserStatusUpdate = (io: Server,id: number) => {
    const rooms = io.sockets.adapter.rooms;
    const online = Array.from(rooms.keys()).some(roomName => 
        roomName.endsWith(`_${id}`)
    );
    io.emit(USER_STATUS, { online });
}