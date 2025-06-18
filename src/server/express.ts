import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { CORS_OPTIONS } from '../config/constants';

export const createExpressApp = () => {
    const app = express();
    
    app.use(cors(CORS_OPTIONS));
    app.use(bodyParser.json());
    app.options('/graphql', cors(CORS_OPTIONS));
    
    return app;
};