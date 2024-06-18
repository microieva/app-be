import express, { Application } from 'express';
//import { ApolloServer } from '@apollo/server';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from '../swagger';
//import { graphqlHTTP } from "express-graphql";
// import { typeDefs } from '../schema';
// import { makeExecutableSchema } from '@graphql-tools/schema'
import cors from 'cors';
// import { resolvers } from '../graphql/resolvers';
//import { AppContext } from '../graphql/types';
//import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
//import { startStandaloneServer } from '@apollo/server/standalone';
// import http from 'http'
// import { dataSource } from './db.config';
// import {expressMiddleware} from "@apollo/server/express4";
//import { AppContext } from '../graphql/types';
//import { startStandaloneServer } from '@apollo/server/standalone';

export const configureApp = async (app: Application) => {
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cors());
  //const httpServer = http.createServer(app);

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use(express.static('uploads'));
  app.use(
    morgan(
      ':remote-addr :date[iso] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
    ),
  );

  // const execSchema = makeExecutableSchema({
  //   typeDefs,
  //   resolvers
  // });

  // const server = new ApolloServer({
  //   schema: execSchema,
  //   introspection: true,
  //   plugins: [ ApolloServerPluginDrainHttpServer({httpServer}) ]
  // });

  // await dataSource.initialize()
  //   .then(async () => console.log('Datasource Initialized'))
  //   .catch(error => console.log('Datasource Initialization Error: ', error));

  // await server.start()
  //   .then(()=> console.log('Apollo Server Started'))
  //   .catch(error => console.log('Apollo Server Error: ', error));

  // const corsOptions: cors.CorsOptions = {
  //   origin: ['http://localhost:4000/graphql'],
  //   credentials: true,
  //   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  //   preflightContinue: false,
  //   optionsSuccessStatus: 204
  // }

  // app.use(
  //   "/graphql",
  //   // graphqlHTTP({
  //   //   schema: execSchema,
  //   //   graphiql: true, // false in production
  //   // }),
  //   cors<cors.CorsRequest>(corsOptions),
  //   express.json(),
  //   expressMiddleware(server, {
  //     context: async () => {
  //       console.log('IS THIS RUNNING ???')
  //       const myStr = "hello"
  //       return {
  //         myStr,
  //         dataSource
  //       }
  //     }
  //   })
  // )
};
