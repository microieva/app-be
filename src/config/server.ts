import { createServer } from "http";
import { createExpressApp } from "../server/express";
import { createApolloServer } from "../server/apollo/config";
import { createContext } from "../server/apollo/context";
import { cleanupSocketServer, createSocketServer } from "../server/socket/index";
import { getDataSource } from "./data-source";
import { expressMiddleware } from '@apollo/server/express4';
import { PORT } from "./constants";
import { connectWithRetry, redisClient } from "../server/socket/redis"; 

export const startServer = async () => {
    const app = createExpressApp();
    const httpServer = createServer(app);
    const dataSource = getDataSource();
    const apolloServer = createApolloServer();

    console.log('Connecting to services...');
    const loadingInterval = setInterval(() => process.stdout.write('.'), 500);

    try {
        await connectWithRetry();
        console.info('Redis connected successfully');

        await dataSource.initialize();
        clearInterval(loadingInterval);
        console.info('Database connected successfully');

        const io = await createSocketServer(httpServer);
        console.info("Socket.IO server with Redis adapter initialized");

        await apolloServer.start();
        app.use('/graphql', expressMiddleware(apolloServer, {
            context: createContext({ io, dataSource })
        }));

        httpServer.listen(PORT, () => {
            setInterval(() => {
                if (!redisClient.isReady) {
                    console.error('Redis not ready - failing health checks');
                    process.exit(1); 
                }
            }, 30000);
            console.info(`
                Server ready at http://localhost:${PORT}/graphql
                WebSocket endpoint: ws://localhost:${PORT}
                Redis status: ${redisClient.isReady ? 'connected' : 'disconnected'}
            `);
        });

        process.on('SIGTERM', async () => {
            console.info('Shutting down gracefully...');
            await Promise.all([
                cleanupSocketServer(), 
                redisClient.quit(),
                dataSource.destroy(),
                new Promise<void>((resolve) => httpServer.close(() => resolve()))
            ]);
            process.exit(0);
        });

    } catch (error) {
        clearInterval(loadingInterval);
        console.error('Server startup failed:', error);
        
        await Promise.allSettled([
            cleanupSocketServer(),
            redisClient.quit(),
            dataSource.destroy()
        ]);
        
        process.exit(1);
    }
};