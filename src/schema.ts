import { gql } from "apollo-server";

export const schema = `
type Query {
  testApps: [TestApp!]!
}

type Mutation {
  saveTestApp(testAppInput: TestAppInput): MutationResponse!
}

type MutationResponse {
  success: Boolean
  message: String
}

type TestApp {
  id: Int!
  testAppName: String!
  isAppConnected: Boolean
}

input TestAppInput {
  testAppName: String!
  isAppConnected: Boolean
}
`

export const typeDefs = gql(schema);


