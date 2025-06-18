import { Server } from 'socket.io';
import { CORS_OPTIONS } from '../config/constants';
import {DOCTOR_ROOM_UPDATE, USER_STATUS} from '../graphql/constants';

export const createSocketServer = (httpServer: any) => {
    const io = new Server(httpServer, {
        cors: CORS_OPTIONS
    });

    const activeDoctors = new Map();
    
    io.on('connect', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join_room', (user) => {
        if (user && user.id && user.userRole) {
            const personalRoom = `${user.userRole}_${user.id}`;
            const roleRoom = `${user.userRole}s`; 
            socket.join([personalRoom, roleRoom]);
            
            if (user.userRole === 'doctor') {
                activeDoctors.set(user.id, socket.id);
                sendDoctorsRoomUpdate();
            };
            if (user.userRole === 'admin') {
                sendDoctorsRoom(socket);
            }
            if (user.userRole !== 'patient') {
                sendUserStatus(user.id);
            }
        } else {
            console.warn('Invalid join request - missing user data');
        }
    });
    
    socket.on('leave_room', (id:number)=> {
        for (const [doctorId] of activeDoctors) {
            if (doctorId === id ) {
                activeDoctors.delete(doctorId);
                
                const personalRoom = `doctor_${doctorId}`;
                socket.leave(personalRoom);
                socket.leave('doctors');
                
                sendDoctorsRoomUpdate();
                sendUserStatus(id);
                break;
            }
        }
    });
    
    socket.on('request_room', () => {
        if (io.sockets.adapter.rooms.has('admins')) {
            sendDoctorsRoom(socket);
        }
    });

    socket.on('request_status', (id:number) => {
        sendUserStatus(id);
    });

    function sendUserStatus(userId:number){
        const rooms = io.sockets.adapter.rooms;
        let online:boolean = false;
        for (const [roomName] of rooms) {
            if (roomName.endsWith(`_${userId}`)) {
                online = true;
                break;
            }
        }
        io.emit(USER_STATUS, { online });
    }

    function sendDoctorsRoomUpdate() {
        if (io.sockets.adapter.rooms.has('admins')) {
            const doctorIds = Array.from(activeDoctors.keys());
            io.to('admins').emit(DOCTOR_ROOM_UPDATE, {
                doctorIds,
                timestamp: new Date()
            });
        }
    }
    function sendDoctorsRoom(targetSocket) {
        const doctorIds = Array.from(activeDoctors.keys())
        targetSocket.emit(DOCTOR_ROOM_UPDATE, {
            doctorIds,
            timestamp: new Date()
        });
    }

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        socket.disconnect(); 
    });
});

    return { io, activeDoctors };
};