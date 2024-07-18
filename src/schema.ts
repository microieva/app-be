import { gql } from "graphql-tag";

export const schema = `
  scalar Date

  union Paginated = Appointment

  type Query {
    me: User!
    users: [User!]!
    login(directLoginInput: LoginInput!): String!
    testApps: [TestApp!]!
    testApp(testAppId: Int!): TestApp!
    allAppointments: [Appointment!]!
    appointments: [Appointment!]!
    appointment (appointmentId: Int!): Appointment!
    pendingAppointments: [Appointment!]!
    upcomingAppointments: [Appointment!]!
    pastAppointments: [Appointment!]!
  }

  type Mutation {
    saveTestApp(testAppInput: TestAppInput): MutationResponse!
    deleteTestApp(testAppId: Int!): MutationResponse!
    saveUser(userInput: UserInput!): MutationResponse!
    deleteUser(userId: Int!): MutationResponse!
    loginWithGoogle(googleCredential: String!): String!
    loginWithSignicat(signicatAccessToken: String!): String!
    saveAppointment(appointmentInput: AppointmentInput!): MutationResponse!
    deleteAppointment(appointmentId: Int!): MutationResponse!
  }

  type MutationResponse {
    success: Boolean!
    message: String!
  }

  type Paged {
    slice: [Paginated!]!
    length: Int!
  }

  type PagedAppointments {
    pending: Paged!
    upcoming: Paged!
    past: Paged!
  }

  type TestApp {
    id: Int!
    testAppName: String!
    isAppConnected: Boolean
  }

  type User {
    id: Int!
    firstName: String
    lastName: String
    userRole: String!
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
    countAppointments: Int!
  }

  type Appointment {
    id: Int!
    doctorId: Int
    patientId: Int
    createdAt: Date
    updatedAt: Date
    start: Date!
    end: Date!
    allDay: Boolean
    patient: User
    doctor: User
  }

  input TestAppInput {
    id: Int
    testAppName: String!
    isAppConnected: Boolean
  }

  input UserInput {
    id: Int
    userRoleId: Int
    firstName: String
    lastName: String
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

  input AppointmentInput {
    id: Int
    start: Date!
    end: Date!
    allDay: Boolean!
  }
`

export const typeDefs = gql(schema);


