import dotenv from 'dotenv';
import "reflect-metadata";
import cors from 'cors';
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema';
import { resolvers } from './graphql/resolvers';
import { devDataSource } from './configurations/dev-db.config';
import { prodDataSource } from './configurations/prod-db.config';
import { AppContext } from './graphql/types';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({path: `.env.${process.env.NODE_ENV}`})
} else {
    dotenv.config({path: '.env.production'})
}

const app = express();
const port = parseInt(process.env.PORT) || 4000;
const server = new ApolloServer<AppContext>({ typeDefs, resolvers });
const dataSource = process.env.NODE_ENV === 'production' ? prodDataSource : devDataSource;

const corsOptions = {
    origin: process.env.NOTIFICATIONS_ORIGIN,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, 
    allowedHeaders: 'Content-Type,Authorization'
};
  
app.use(cors(corsOptions));

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: corsOptions
});

io.on('connection', (socket) => {
    console.log('a user connected: ');

    socket.on('sendNotification', (message) => {
        io.emit('receiveNotification', message);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

io.httpServer.listen(4001, ()=> {console.log("io socket ready")});

const startServer = async () => {
    console.log('Connecting to database...');
    const dot = '.';
    let str =''

    const loadingInterval = setInterval(() => {
        str = str+dot;
        console.log(str);
    }, 5000); 

    await dataSource
        .initialize()
        .then(async () => {
            clearInterval(loadingInterval); 
            console.log('Datasource Initialized')
        })
        .catch(error => {
            clearInterval(loadingInterval); 
            console.log('Datasource Initialization Error: ', error)
        });
    
    const { url } = await startStandaloneServer(server, {
        context: async ({ req, res }) => {
            const token = req.headers.authorization?.split(' ')[1];
            let me = null;

            if (token) {
                const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
                const currentTime = Math.floor(Date.now() / 1000);

                if (payload.exp && currentTime < payload.exp) {
                    me = { userId : payload.userId }
                } 
            }
            
            return {
                io,
                dataSource,
                me
            }
        },
        listen: { port }
    });
    console.log(`🚀  Server ready at ${url}`);

}
startServer();

