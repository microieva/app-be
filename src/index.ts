import "reflect-metadata";
import { loadEnvironment } from './config/environment';
import { startServer } from './config/server';
import './config/constants'; 

loadEnvironment();

startServer().catch(err => {
    console.error('Fatal error during startup:', err);
    process.exit(1);
});
