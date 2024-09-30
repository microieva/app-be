import dotenv from 'dotenv';
import "reflect-metadata";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema';
import { resolvers } from './graphql/resolvers';
import { devDataSource } from './configurations/dev-db.config';
import { prodDataSource } from './configurations/prod-db.config';
import { AppContext } from './graphql/types';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({path: `.env.${process.env.NODE_ENV}`})
} else {
    dotenv.config({path: '.env.production'})
}

const port = parseInt(process.env.PORT) || 4000;
const server = new ApolloServer<AppContext>({ typeDefs, resolvers });
const dataSource = process.env.NODE_ENV === 'production' ? prodDataSource : devDataSource;

const startServer = async () => {
    await dataSource.initialize()
        .then(async () => console.log('Datasource Initialized'))
        .catch(error => console.log('Datasource Initialization Error: ', error));
    
    const { url } = await startStandaloneServer(server, {
        context: async ({ req, res }) => {
            const token = req.headers.authorization?.split(' ')[1];
            let me = null;

            if (token) {
                const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
                const currentTime = Math.floor(Date.now() / 1000);

                if (payload.exp && currentTime < payload.exp) {
                    me = { userId : payload.userId }
                } 
            }
            
            return {
                dataSource,
                me
            }
        },
        listen: { port }
    });
    console.log(`🚀  Server ready at ${url}`);

}
startServer();
