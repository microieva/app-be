import { queries } from "./query.resolver";
import { testAppMutationResolver } from "./test-app/test-app.mutation.resolver";

export const resolvers = [
    queries,
    testAppMutationResolver
]