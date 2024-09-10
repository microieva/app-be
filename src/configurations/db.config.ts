import 'dotenv/config'; 
import "reflect-metadata";
//import { DataSource } from 'typeorm';
//import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { ManagedIdentityCredential } from '@azure/identity';
// import { UserRole } from '../graphql/user/user-role.model';
// import { User } from '../graphql/user/user.model';
// import { Appointment } from '../graphql/appointment/appointment.model';
// import { Record } from '../graphql/record/record.model';
// import { DoctorRequest } from '../graphql/doctor-request/doctor-request.model';

const credential = new ManagedIdentityCredential();

async function fetchToken() {
    const tokenResponse = await credential.getToken("https://database.windows.net/");
    const token = tokenResponse.token; // Now token is a string
    return token;
}

export async function createConfig() {
    const token = await fetchToken(); 
    console.log('TOKEN---------->', token)
    const config = {
        server: "health-center",
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        authentication: {
            type: "azure-active-directory-access-token",
            options: {
                token: token 
            }
        }
    };

    return config; 
}

//export const pool = new ConnectionPool(config as any);

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
