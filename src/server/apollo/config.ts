require('dotenv');
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageGraphQLPlayground } from '@apollo/server-plugin-landing-page-graphql-playground';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { typeDefs } from '../../schema';
import { resolvers } from '../../graphql/resolvers';
import { AppContext } from '../../graphql/types';

export const createApolloServer = () => {
    return new ApolloServer<AppContext>({
        typeDefs,
        resolvers,
        introspection: true,
        plugins: [
            process.env.NODE_ENV === 'production' 
                ? ApolloServerPluginLandingPageGraphQLPlayground() 
                : ApolloServerPluginLandingPageLocalDefault()
        ]
    });
};