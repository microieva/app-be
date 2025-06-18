import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../../config/constants";
import { DataSource } from "typeorm";
import { Server } from "socket.io";

interface ContextParams {
    io: Server;
    dataSource: DataSource;
}

export const createContext = ({ io, dataSource }: ContextParams) => {
    return async ({ req }: { req: any }) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            let me = null;

            if (token) {
                const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
                const currentTime = Math.floor(Date.now() / 1000);

                if (payload.exp && currentTime < payload.exp) {
                    me = { userId: payload.userId };
                }
            }

            return { io, dataSource, me };
        } catch (error) {
            console.error('Context creation error:', error);
            throw new Error('Authentication failed');
        }
    };
};