require('dotenv');
import dotenv from 'dotenv';

export const loadEnvironment = () => {
    if (process.env.NODE_ENV !== 'production') {
        dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    } else {
        dotenv.config({ path: '.env.production' });
    }
};