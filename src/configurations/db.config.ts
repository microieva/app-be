import 'dotenv/config'; 
import { DataSource } from 'typeorm';
import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { UserRole } from '../graphql/user/user-role.model';
import { User } from '../graphql/user/user.model';
import { Appointment } from '../graphql/appointment/appointment.model';
import { Record } from '../graphql/record/record.model';
import { DoctorRequest } from '../graphql/doctor-request/doctor-request.model';

const options: SqlServerConnectionOptions = {
    type: 'mssql',
    //url:'localhost://127.0.0.1:1433;databaseName=SQL_DB;',
    //url: 'jdbc:mssql://localhost:1433/SQL_DB;',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username:  process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    logging: false,
    synchronize: true,
    entities: [
        UserRole,
        User,
        Appointment,
        Record,
        DoctorRequest
    ],
    migrations: ["./src/migration/*.ts"],
    extra: {
        trustServerCertificate: true
    },
    options: {
        encrypt: true
    }
};
export const dataSource = new DataSource(options);
