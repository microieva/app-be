import { Server, Socket } from "socket.io";
import logger from "../../utils/logger";

export const activeDoctors = new Map();

export const handleConnection = (io: Server, socket: Socket) => {
    socket.on('join_room', (user) => {
        if (user?.id && user?.userRole) {
            const personalRoom = `${user.userRole}_${user.id}`;
            const roleRoom = `${user.userRole}s`;
            socket.join([personalRoom, roleRoom]);
            logger.info('User joined rooms: ', personalRoom, roleRoom)
        }
    });

    socket.on('disconnect', () => {
        socket.disconnect(true);
        console.log('Client disconnected:', socket.id);
    });
};