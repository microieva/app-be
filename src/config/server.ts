import { createServer } from "http";
import { createExpressApp } from "../server/express";
import { createApolloServer } from "../server/apollo/config";
import { createContext } from "../server/apollo/context";
import { createSocketServer } from "../server/socket";
import { getDataSource } from "./data-source";
import { expressMiddleware } from '@apollo/server/express4';
import { PORT } from "./constants";

export const startServer = async () => {
    const dataSource = getDataSource();
    const app = createExpressApp();
    const httpServer = createServer(app);
    const io = createSocketServer(httpServer);
    const apolloServer = createApolloServer();

    console.log('Connecting to database...');
    const loadingInterval = setInterval(() => {
        process.stdout.write('.');
    }, 5000);

    try {
        await dataSource.initialize();
        clearInterval(loadingInterval);
        console.log('\nDatasource Initialized');

        await apolloServer.start();
        app.use('/graphql', expressMiddleware(apolloServer, {
            context: createContext({ io: io.io, dataSource })
        }));

        httpServer.listen(PORT, () => {
            console.log(`Server ready at http://localhost:${PORT}/graphql`);
            console.log(`Socket.io server running on port ${PORT}`);
        });
    } catch (error) {
        clearInterval(loadingInterval);
        console.error('\nServer startup error:', error);
        process.exit(1);
    }
};