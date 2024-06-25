import { GraphQLScalarType, Kind } from "graphql";
//import { DateTime } from "luxon";
import { queries } from "./query.resolver";
import { userResolver } from "./user/user.resolver";
import { userMutationResolver } from "./user/user.mutation.resolver";
import { testAppMutationResolver } from "./test-app/test-app.mutation.resolver";
//import { DateTime } from "./types";

const scalars = {
    Date: new GraphQLScalarType({
        // name: 'Date',
        // description: 'DateTime from luxon',
        // serialize(value: Date) {
        //     return value
        //     //return DateTime.fromJSDate(value);
        //     // value sent to the client
        // },
        // parseValue(value: string){
        //   // value from client
        //   console.log('SCALAR parseValue run: ', value, typeof value)
        //   return new Date(value)
        // },
        // parseLiteral(ast) {
        //     console.log('SCALAR parseLiteral run: ', ast)
        //     if (ast.kind === Kind.INT) {
        //       return new Date(parseInt(ast.value, 10));
        //       // ast value is always in string format
        //     }
        //     return null      
        // }
        name: 'Date',
        description: 'Date custom scalar type',
        serialize(value) {
          return value;
          // if (value instanceof Date) {
          //   return value.getTime(); // Convert outgoing Date to integer for JSON
          // }
          // throw Error('GraphQL Date Scalar serializer expected a `Date` object');
        },
        parseValue(value) {
          if (typeof value === 'number' || typeof value === 'string') {
            return new Date(value); // Convert incoming integer to Date
          }
          throw new Error('GraphQL Date Scalar parser expected a `number`');
        },
        parseLiteral(ast) {
          if (ast.kind === Kind.INT) {
            // Convert hard-coded AST string to integer and then to Date
            return new Date(parseInt(ast.value, 10));
          }
          // Invalid hard-coded value (not an integer)
          return null;
        }
    })
}

export const resolvers = [
    scalars,
    queries,
    testAppMutationResolver,
    userMutationResolver,
    userResolver
]
