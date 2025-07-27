import { Server, Socket } from "socket.io";
import {DOCTOR_ROOM_UPDATE} from "../../../graphql/constants";
import { sendUserStatusUpdate } from "./user-events";
import logger from '../../../utils/logger';

const activeDoctors = new Map(); 

export const handleDoctorsRoomEvents = (io: Server, socket: Socket) => {
    socket.on('join_room', (user) => {
        if (user.userRole === 'doctor') {
            activeDoctors.set(user.id, socket.id);
            sendDoctorsRoomUpdate(io);
            sendUserStatusUpdate(io, user.id);
        }
    });

    socket.on('leave_room', async (id: number) => {
        const rooms: string[] = [];
        io.sockets.adapter.rooms.forEach((sockets, roomName) => {
            if (sockets.has(socket.id)) {
            rooms.push(roomName);
            }
        });
        rooms.forEach(room => {
            if (room !== socket.id) { 
                socket.leave(room);
                
                if (io.sockets.adapter.rooms.get(room)?.has(socket.id)) {
                    logger.warn(`Failed to remove ${socket.id} from room ${room}`);
                }
            }
        });
        if (activeDoctors.has(id)) {
            activeDoctors.delete(id);
            sendDoctorsRoomUpdate(io);
            sendUserStatusUpdate(io, id);
        }
    });

    socket.on('request_room', () => {
        if (io.sockets.adapter.rooms.has('admins')) {
            sendDoctorsRoom(socket, Array.from(activeDoctors.keys()));
        }
    });
};

const sendDoctorsRoomUpdate = (io: Server) => {
    if (io.sockets.adapter.rooms.has('admins')) {
        io.to('admins').emit(DOCTOR_ROOM_UPDATE, {
            doctorIds: Array.from(activeDoctors.keys()),
            timestamp: new Date()
        });
    }
};

const sendDoctorsRoom = (socket: Socket, doctorIds: any[]) => {
    socket.emit(DOCTOR_ROOM_UPDATE, {
        doctorIds,
        timestamp: new Date()
    });
};