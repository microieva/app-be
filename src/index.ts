import "reflect-metadata";
import dotenv from 'dotenv';
import cors from 'cors';
import express from "express";
import bodyParser from 'body-parser';
import { createServer } from "http";
import { Server } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApolloServer } from '@apollo/server';
import {ApolloServerPluginLandingPageGraphQLPlayground} from '@apollo/server-plugin-landing-page-graphql-playground';
import {ApolloServerPluginLandingPageLocalDefault} from '@apollo/server/plugin/landingPage/default';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema';
import { resolvers } from './graphql/resolvers';
import { devDataSource } from './configurations/dev-db.config';
import { prodDataSource } from './configurations/prod-db.config';
import { AppContext } from './graphql/types';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({path: `.env.${process.env.NODE_ENV}`});
} else {
    dotenv.config({path: '.env.production'});
}

const app = express();
const port = parseInt(process.env.PORT) || 4000;
const dataSource = process.env.NODE_ENV === 'production' ? prodDataSource : devDataSource;

const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://studio.apollographql.com', process.env.NOTIFICATIONS_ORIGIN] 
        : true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, 
    allowedHeaders: ["Content-Type", "Authorization", "x-apollo-operation-name", "access-control-allow-origin"]
};


app.use(cors(corsOptions));
app.use(bodyParser.json());  
const httpServer = createServer(app);

const apolloServer = new ApolloServer<AppContext>({
    typeDefs,
    resolvers,
    plugins: [
        process.env.NODE_ENV === 'production' 
            ? ApolloServerPluginLandingPageGraphQLPlayground() 
            : ApolloServerPluginLandingPageLocalDefault(),
    ],
});


const io = new Server(httpServer, {
    cors: corsOptions
});

const onlineUsers: any[]=[];

io.on('connection', (socket) => {
    console.log('a user connected: ', socket.id);

    socket.on('registerUser', (user) => {
        if (user.userRole === 'doctor') {
            const userInfo = { socketId: socket.id, id: user.id, userRole: user.userRole, online: true };
            if (!onlineUsers.some(onlineUser => onlineUser.id === userInfo.id)) {
                onlineUsers.push(userInfo);
            }
            io.emit('onlineUsers',onlineUsers);
            io.emit('online', { userId: user.id, online: true });
        }
    });

    socket.on('userLogout', (userId) => {
        const index = onlineUsers.findIndex(user => user.id === userId);

        if (index !== -1) {
            io.emit('online', { userId, online: false });
            onlineUsers.splice(index, 1); 
        }
        io.emit('onlineUsers', onlineUsers);
    });

    socket.on('onlineUser', (userId) => {
        const online = onlineUsers.some(onlineUser => onlineUser.id === userId);
        io.emit('online', {userId, online}); 
    });

    socket.on('sendNotification', (message) => {
        io.emit('receiveNotification', message);
    });

    socket.on('updateMissedAppointmentsAcount', (isUpdated)=> {
        io.emit('getMissedAppointmentsCount', isUpdated)
    })

    socket.on('triggerRefresh', (isUpdated) => {
        io.emit('refreshEvent', isUpdated);
        io.emit('refreshEvent', false);
    })

    socket.on('notifyDoctors', (info)=> {
        if (onlineUsers.some(user => user.userRole === 'doctor')) {
            io.emit('newAppointmentRequest', info);
            io.emit('refreshEvent', true);
            io.emit('refreshEvent', false);
        }
    });

    socket.on('notifyDoctor', (info)=> {
        if (Array.from(onlineUsers).some(user => user.userRole === 'doctor')) {
            io.emit('deletedAppointmentInfo', info);
            io.emit('refreshEvent', true);
            io.emit('refreshEvent', false);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected ',  socket.id);
        const index = onlineUsers.findIndex(user => user.socketId === socket.id);
        const disconnectedUser = onlineUsers[index];

        if (index !== -1) {
            io.emit('online', { userId: disconnectedUser.id, online: false });
            onlineUsers.splice(index, 1); 
        }
        io.emit('onlineUsers', onlineUsers);  
    });

    socket.on('getOnlineUsers', () => {
        socket.emit('onlineUsers', onlineUsers); 
    });
    socket.on('getOneUserStatus', (userId) => {
        const online = onlineUsers.some(onlineUser => onlineUser.id === userId);
        io.emit('online', {userId, online});  
    });
});

const startServer = async () => {
    try {
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

        await apolloServer.start();

        app.use('/graphql', expressMiddleware(apolloServer, {
            context: async ({ req, res }) => {
                const token = req.headers.authorization?.split(' ')[1];
                let me = null;

                if (token) {
                    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
                    const currentTime = Math.floor(Date.now() / 1000);

                    if (payload.exp && currentTime < payload.exp) {
                        me = { userId: payload.userId };
                    }
                }

                return {
                    io,  
                    dataSource,
                    me
                };
            }
        }));

        httpServer.listen(port, () => {
            console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
            console.log(`Socket.io server running on port ${port}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
};

startServer();
