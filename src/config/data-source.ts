require('dotenv');
import { devDataSource } from './db-config/dev-db.config';
import { prodDataSource } from './db-config/prod-db.config';

export const getDataSource = () => 
    process.env.NODE_ENV === 'production' ? prodDataSource : devDataSource;