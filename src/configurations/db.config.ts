import 'dotenv/config'; 
import "reflect-metadata";
//import { DataSource } from 'typeorm';
import { ConnectionPool } from "mssql";
//import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { ManagedIdentityCredential } from '@azure/identity';
// import { UserRole } from '../graphql/user/user-role.model';
// import { User } from '../graphql/user/user.model';
// import { Appointment } from '../graphql/appointment/appointment.model';
// import { Record } from '../graphql/record/record.model';
// import { DoctorRequest } from '../graphql/doctor-request/doctor-request.model';

const credential = new ManagedIdentityCredential();
const token = credential.getToken("https://database.windows.net/").then(token => token.token)
console.log('TOKEN---------->', token)

const config = {
    server: "health-center",
    port: Number(process.env.DB_PORT),
    username:  process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    // pool: {
    //     min: 1,
    //     max: 10,
    //     idleTimeoutMillis: 30000 // Close idle connections after 30 seconds
    // }
    authentication: {
        type: "azure-active-directory-access-token",
        options: {
            // token: async () => {
            //     const tokenResponse = await credential.getToken("https://database.windows.net/"); // .default
            //     console.log('TOKEN RESPONSE--------------- >>>: ', tokenResponse);
            //     if (!tokenResponse || !tokenResponse.token) {
            //         throw new Error('Failed to retrieve token');
            //     }
            //     const token = tokenResponse.token
            //     return token;
            // }
            token
        }
    }
}

export const pool = new ConnectionPool(config as any);

/*const options: SqlServerConnectionOptions = {
    type: 'mssql',
    //url:'localhost://127.0.0.1:1433;databaseName=SQL_DB;',
    //url: 'jdbc:mssql://localhost:1433/SQL_DB;',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username:  process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    logging: true,
    synchronize: true,
    // entities: [
    //     UserRole,
    //     User,
    //     Appointment,
    //     Record,
    //     DoctorRequest
    // ],
    entities: [
        __dirname, './dist/graphql/'
    ],
    migrations: ["./src/migration/*.ts"],
    extra: {
        trustServerCertificate: true,
        authentication: {
            type: "azure-active-directory-access-token",
            options: {
                token: async () => {
                    const tokenResponse = await credential.getToken("https://database.windows.net/"); // .default
                    console.log('TOKEN RESPONSE--------------- >>>: ', tokenResponse);
                    if (!tokenResponse || !tokenResponse.token) {
                        throw new Error('Failed to retrieve token');
                    }
                    const token = tokenResponse.token
                    return token;
                }
            }
        }
    },
    options: {
        encrypt: true  
    }
};
export const dataSource = new DataSource(options);*/
