import 'dotenv/config'; 
import "reflect-metadata";
import { DataSource } from 'typeorm';
import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { DefaultAzureCredential } from '@azure/identity';
// import { UserRole } from '../graphql/user/user-role.model';
// import { User } from '../graphql/user/user.model';
// import { Appointment } from '../graphql/appointment/appointment.model';
// import { Record } from '../graphql/record/record.model';
// import { DoctorRequest } from '../graphql/doctor-request/doctor-request.model';

const credential = new DefaultAzureCredential();

const options: SqlServerConnectionOptions = {
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
                    const tokenResponse = await credential.getToken('https://database.windows.net/.default');
                    return tokenResponse.token;
                }
            }
        }
    },
    options: {
        encrypt: true  
    }
};
export const dataSource = new DataSource(options);
