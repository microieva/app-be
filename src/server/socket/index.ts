import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient } from "./redis"; 
import { handleConnection } from "./handlers";
import { handleDoctorsRoomEvents } from "./events/doctor-events";
import { handleUserEvents } from "./events/user-events";
import { CORS_OPTIONS } from "../../config/constants";
import { RedisClientType, RedisFunctions, RedisModules, RedisScripts } from '@redis/client';

let io: Server;
let pubClient: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
let subClient: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

export const createSocketServer = async (httpServer: HttpServer) => {
    pubClient = redisClient.duplicate();
    subClient = redisClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io = new Server(httpServer, {
        cors: CORS_OPTIONS,
        transports: ["websocket"],
        adapter: createAdapter(pubClient, subClient)
    });

    io.on('connection', (socket: Socket) => {
         try {     
            handleConnection(io, socket);
            handleDoctorsRoomEvents(io, socket);
            handleUserEvents(io, socket);
            console.info(`New connection: ${socket.id}`);
        } catch (err) {
            console.error('Connection handler error:', err);
            socket.disconnect(true);
        }
    });

    io.of("/").adapter.on("error", (err) => {
        console.error("Socket adapter error:", err);
    });

    return io;
};

export const cleanupSocketServer = async (): Promise<void> => {
    try {
        console.info('Starting Socket.IO server cleanup...');
        
        if (io) {
            await new Promise<void>((resolve) => {
                io.close(() => {
                    console.info('Socket.IO server closed');
                    resolve();
                });
            });
        }

        if (pubClient) {
            await pubClient.quit();
            console.info('Redis pub client disconnected');
        }

        if (subClient) {
            await subClient.quit();
            console.info('Redis sub client disconnected');
        }
    } catch (err) {
        console.error('Error during Socket.IO cleanup:', err);
        throw err; // Re-throw to handle in the calling function
    }
};

export const getSocketInstance = () => {
    if (!io) throw new Error("Socket.IO server not initialized");
    return io;
};