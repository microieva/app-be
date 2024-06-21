import { GraphQLScalarType, Kind } from "graphql";
import { DateTime } from "luxon";
import { queries } from "./query.resolver";
import { userResolver } from "./user/user.resolver";
import { userMutationResolver } from "./user/user.mutation.resolver";
import { testAppMutationResolver } from "./test-app/test-app.mutation.resolver";

const scalars = {
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'DateTime from luxon',
        serialize(value: Date) {
            return value
            // value sent to the client
        },
        parseValue(value: DateTime){
          // value from client
          return new Date(value.toString());
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
              return new Date(parseInt(ast.value, 10));
              // ast value is always in string format
            }
            return null      
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
