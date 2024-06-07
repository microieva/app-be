import 'dotenv/config'; 
import { DataSource } from 'typeorm';
import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { TestApp } from '../graphql/test-app/test-app.model';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from '../schema';
import { resolvers } from '../graphql/resolvers';


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
  entities: [TestApp],
  migrations: ["./src/migration/*.ts"],
  options: {
  
  },
  extra: {
    trustServerCertificate: true
  }
};
const dataSource = new DataSource(options);

dataSource.initialize()
  .then(() => {
      const app = express();
      const server = new ApolloServer({
        typeDefs,
        resolvers
      })
      server.start().then(()=> {
        server.applyMiddleware({
          app,
          cors: {
            origin: ['http://localhost:4000/graphql', 'htpp://localhost:8080', 'localhost://127.0.0.1:1433;databaseName=SQL_DB;'], 
            credentials: true,
          }
        });
        console.log('APOLLO server STARTED')
      })
      .catch((error)=> {
        console.log('APOLLO server ERROR: ', error)
      })
      console.log("*** Data Source initialized ***")
  })
  .catch((err) => {
      console.error("Error during Data Source initialization", err)
  }); 

export default dataSource;




