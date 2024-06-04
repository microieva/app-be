import 'dotenv/config'; 
import { DataSource } from 'typeorm';
import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';

const options: SqlServerConnectionOptions = {
  type: 'mssql',
  //url:'localhost://127.0.0.1:1433;databaseName=APP_DB;',
  //url: 'jdbc:mssql://localhost:1433/APP_DB ',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username:  process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  logging: false,
  synchronize: true,
  entities: [],
  migrations: ["./src/migration/*.ts"],
  extra: {
    trustServerCertificate: true
  }
};
export const dataSource = new DataSource(options);

