import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient } from "./redis"; 
import { handleConnection } from "./handlers";
import { handleDoctorEvents } from "./events/doctor-events";
import { handleUserEvents } from "./events/user-events";
import { CORS_OPTIONS } from "../../config/constants";

let io: Server;

export const createSocketServer = async (httpServer: HttpServer) => {
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    
    await Promise.all([pubClient.connect(), subClient.connect()]);

    io = new Server(httpServer, {
        cors: CORS_OPTIONS,
        transports: ["websocket"],
        adapter: createAdapter(pubClient, subClient)
    });

    io.on('connection', (socket: Socket) => {
        console.info(`New connection: ${socket.id}`);
        
        handleConnection(io, socket);
        handleDoctorEvents(io, socket);
        handleUserEvents(io, socket);

        socket.on('disconnect', () => {
            console.info(`Client disconnected: ${socket.id}`);
        });
    });

    io.of("/").adapter.on("error", (err) => {
        console.error("Socket adapter error:", err);
    });

    console.info("Socket.IO server with Redis adapter initialized");
    return io;
};

export const getSocketInstance = () => {
    if (!io) throw new Error("Socket.IO server not initialized");
    return io;
};