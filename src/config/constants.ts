import { config } from 'dotenv';

config(); 

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

export const CORS_OPTIONS = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://studio.apollographql.com', process.env.NOTIFICATIONS_ORIGIN] 
        : 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-apollo-operation-name", "access-control-allow-origin"]
};

export const PORT = parseInt(process.env.PORT || '4000');
export const JWT_SECRET = process.env.JWT_SECRET; 
