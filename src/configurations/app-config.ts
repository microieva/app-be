import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from '../swagger';
import { graphqlHTTP } from "express-graphql";
import { typeDefs } from '../schema';
import { makeExecutableSchema } from '@graphql-tools/schema'
import cors from 'cors';
import { resolvers } from '../graphql/resolvers';

export const configureApp = (app: Application) => {
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cors());

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use(express.static('uploads'));
  app.use(
    morgan(
      ':remote-addr :date[iso] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
    ),
  );

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  app.use(
    "/graphql",
    graphqlHTTP({
      schema,
      graphiql: true, // false in production
    })
  );
};
