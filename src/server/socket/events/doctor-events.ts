import { Server, Socket } from "socket.io";
import {DOCTOR_ROOM_UPDATE} from "../../../graphql/constants";

const activeDoctors = new Map(); 

export const handleDoctorsRoomEvents = (io: Server, socket: Socket) => {
    socket.on('join_room', (user) => {
        if (user.userRole === 'doctor') {
            activeDoctors.set(user.id, socket.id);
            sendDoctorsRoomUpdate(io);
        }
    });

    socket.on('leave_room', (id: number) => {
        if (activeDoctors.has(id)) {
            activeDoctors.delete(id);
            sendDoctorsRoomUpdate(io);
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