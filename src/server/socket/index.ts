import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { handleConnection } from "./handlers";
import { handleDoctorEvents } from "./events/doctor-events";
import { handleUserEvents } from "./events/user-events";
import { CORS_OPTIONS } from "../../config/constants";

export const createSocketServer = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: CORS_OPTIONS
    });

    io.on('connection', (socket: Socket) => {      
        handleConnection(io, socket);
        handleDoctorEvents(io, socket);
        handleUserEvents(io, socket);
    });

    return io;
};