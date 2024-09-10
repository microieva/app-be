import "reflect-metadata";
//import jwt , { JwtPayload } from "jsonwebtoken";
// import { ApolloServer } from '@apollo/server';
//import { startStandaloneServer } from '@apollo/server/standalone';
// import { typeDefs } from './schema';
// import { resolvers } from './graphql/resolvers';
//import { dataSource } from './configurations/db.config';
//import { AppContext } from './graphql/types';
import { pool } from "./configurations/db.config";

pool.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to the database');
    }
})

// const port = parseInt(process.env.PORT) || 4000;
// const server = new ApolloServer<AppContext>({ typeDefs, resolvers });

/*const startServer = async () => {
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
        listen: { port },
  });
  console.log(`🚀  Server ready at ${url}`);

}
startServer();*/
