require('dotenv');
import { devDataSource } from '../configurations/dev-db.config';
import { prodDataSource } from '../configurations/prod-db.config';

export const getDataSource = () => 
    process.env.NODE_ENV === 'production' ? prodDataSource : devDataSource;