import { queries } from "./query.resolver";
import { testAppMutationResolver } from "./test-app/test-app.mutation.resolver";
import { userMutationResolver } from "./user/user.mutation.resolver";

export const resolvers = [
    queries,
    testAppMutationResolver,
    userMutationResolver
]