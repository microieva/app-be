import { gql } from "graphql-tag";

export const schema = `
  scalar Date

  type Query {
    me: User!
    users: [User!]!
    login(directLoginInput: LoginInput!): String!
    testApps: [TestApp!]!
    testApp(testAppId: Int!): TestApp!
  }

  type Mutation {
    saveTestApp(testAppInput: TestAppInput): MutationResponse!
    deleteTestApp(testAppId: Int!): MutationResponse!
    saveUser(userInput: UserInput!): MutationResponse!
    deleteUser(userId: Int!): MutationResponse!
    loginWithGoogle(googleCredential: String!): String!
    loginWithSignicat(signicatAccessToken: String!): String!
  }

  type MutationResponse {
    success: Boolean!
    message: String!
  }

  type TestApp {
    id: Int!
    testAppName: String!
    isAppConnected: Boolean
  }

  input TestAppInput {
    id: Int
    testAppName: String!
    isAppConnected: Boolean
  }

  input UserInput {
    id: Int
    firstName: String
    lastName: String
    userRoleId: Int
    phone: String
    email: String
    password: String
    dob: Date
    streetAddress: String
    city: String
    postCode: String
    lastLogInAt: Date
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type User {
    id: Int!
    firstName: String
    lastName: String
    userRole: String
    phone: String
    email: String
    password: String
    dob: Date
    streetAddress: String
    city: String
    postCode: String
    createdAt: Date
    lastLogInAt: Date
    updatedAt: Date
  }
`

export const typeDefs = gql(schema);


