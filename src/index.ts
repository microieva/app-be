// import cluster from 'cluster';
// import os from 'os';
//import app from './app'; 
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { AppContext } from './graphql/types';
import { typeDefs } from './schema';
import { resolvers } from './graphql/resolvers';
import { dataSource } from './configurations/db.config';

// const numCPUs = 1;
const port = parseInt(process.env.PORT) || 4000;
const server = new ApolloServer<AppContext>({ typeDefs, resolvers });

const startServer = async () => {
  await dataSource.initialize()
    .then(async () => console.log('Datasource Initialized'))
    .catch(error => console.log('Datasource Initialization Error: ', error));

  const { url } = await startStandaloneServer(server, {
    context: async () => {
      const authScope = "admin"
      return {
        authScope,
        dataSource
      }
    },
    listen: { port },
  });
  console.log(`🚀  Server ready at ${url}`);
}
startServer();

// if (cluster.isPrimary) {
//   console.log(`Master process (PID ${process.pid}) is running`);

//   const numWorkers = os.cpus().length;

//   console.log(`Master cluster setting up ${numWorkers} workers...`);

//   for (let i = 0; i < numWorkers; i++) {
//     cluster.fork();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`Worker (PID ${worker.process.pid}) died`);
//     // Fork a new worker when one dies to maintain the desired number of workers
//     cluster.fork();
//   });
// } else {
//   // This code will run for each worker
//   const server = app.listen(port, () => {
//     console.log(`Worker (PID ${process.pid}) is running on port ${port}`);
//   });

//   // Process error handler for the worker
//   process.on('unhandledRejection', (reason, promise) => {
//     console.error('Unhandled Rejection at:', promise);
//     console.error('Reason:', reason);
//     process.exit(0);
//   });

//   process.on('uncaughtException', (error) => {
//     console.error('Uncaught Exception:', error);
//     process.exit(0);
//   });

//   // Graceful shutdown
//   process.on('SIGINT', () => {
//     console.log('SIGINT signal received. Shutting down gracefully...');
//     server.close(() => {
//       console.log('Worker closed.');
//       process.exit(0);
//     });
//   });

//   process.on('SIGTERM', () => {
//     console.log('SIGTERM signal received. Shutting down gracefully...');
//     server.close(() => {
//       console.log('Worker closed.');
//       process.exit(0);
//     });
//   });
// }
