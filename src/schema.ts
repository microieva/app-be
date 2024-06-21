import { gql } from "graphql-tag";

export const schema = `
  scalar Date

  type Query {
    users: [User!]!
    testApps: [TestApp!]!
    testApp(testAppId: Int!): TestApp!
  }

  type Mutation {
    saveTestApp(testAppInput: TestAppInput): MutationResponse!
    deleteTestApp(testAppId: Int!): MutationResponse!
    saveDefaultUser(userInput: UserInput!): MutationResponse!
  }

  type LoginResponse {
    success: Boolean!
    message: String!
    token: String
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
    firstName: String!
    lastName: String!
    userRoleId: Int!
    phone: Int!
    email: String!
    password: String
    dob: Date
    streetAddress: String
    city: String
    postCode: Int
  }

  type User {
    firstName: String!
    lastName: String!
    userRole: String!
    phone: Int!
    email: String!
    password: String
    dob: Date!
    streetAddress: String
    city: String
    postCode: Int
    createdAt: Date!
    lastLogInAt: Date
  }
`

export const typeDefs = gql(schema);


