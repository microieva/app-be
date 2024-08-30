import { gql } from "graphql-tag";

export const schema = `
  scalar Date

  union Paginated = Appointment | Record | User | DoctorRequest

  type Query {
    me: User
    user(userId: Int!): User
    request(userId: Int!): DoctorRequest
    doctors(
      pageIndex: Int!, 
      pageLimit: Int!, 
      sortActive: String, 
      sortDirection: String
      filterInput: String
    ): Paged!
    patients(
      pageIndex: Int!, 
      pageLimit: Int!, 
      sortActive: String, 
      sortDirection: String
      filterInput: String
    ): Paged!
    requests(
      pageIndex: Int!, 
      pageLimit: Int!, 
      sortActive: String, 
      sortDirection: String
      filterInput: String
    ): Paged!
    allAppointments: [Appointment!]!
    appointments: [Appointment!]!
    appointment (appointmentId: Int!): Appointment!
    justCreatedAppointment(patientId: Int!): Appointment
    nowAppointment: Appointment
    calendarAllAppointments (monthStart: Date!, monthEnd: Date!, patientId: Int): CalendarSlice!
    calendarMissedAppointments (monthStart: Date!, monthEnd: Date!, patientId: Int): CalendarSlice!
    calendarPendingAppointments (monthStart: Date!, monthEnd: Date!, patientId: Int): CalendarSlice!
    calendarUpcomingAppointments (monthStart: Date!, monthEnd: Date!, patientId: Int): CalendarSlice!
    calendarPastAppointments (monthStart: Date!, monthEnd: Date!, patientId: Int): CalendarSlice!
    pendingAppointments (
      pageIndex: Int!, 
      pageLimit: Int!, 
      sortActive: String, 
      sortDirection: String
      filterInput: String
    ): Paged!
    upcomingAppointments (
      pageIndex: Int!, 
      pageLimit: Int!, 
      sortActive: String, 
      sortDirection: String
      filterInput: String
    ): Paged!
    pastAppointments (
      pageIndex: Int!, 
      pageLimit: Int!, 
      sortActive: String, 
      sortDirection: String
      filterInput: String
    ): Paged!
    isReservedDay(date: Date!):Boolean
    countPendingAppointments: Int!
    countUpcomingAppointments: Int!
    countPastAppointments: Int!
    nextAppointment: NextAppointmentResponse!
    record(recordId: Int, appointmentId: Int): Record
    records(
      pageIndex: Int!, 
      pageLimit: Int!, 
      sortActive: String, 
      sortDirection: String
      filterInput: String
    ): Paged!
    drafts(
      pageIndex: Int!, 
      pageLimit: Int!, 
      sortActive: String, 
      sortDirection: String
      filterInput: String
    ): Paged!
    countUserRecords: RecordCountResponse!
    countDoctorRequests: Int!
    countDoctors: Int!
    countPatients: Int!
    countMissedAppointments: Int!
    countRecords: Int!
  }

  type Mutation {
    saveUser(userInput: UserInput!): MutationResponse!
    deleteUser(userId: Int!): MutationResponse!
    login(directLoginInput: LoginInput!): LoginResponse!
    loginWithGoogle(googleCredential: String!): LoginResponse!
    loginWithSignicat(signicatAccessToken: String!): String!
    saveAppointment(appointmentInput: AppointmentInput!): MutationResponse!
    deleteAppointment(appointmentId: Int!): MutationResponse!
    saveAppointmentMessage(appointmentId: Int!, appointmentMessage: String!): MutationResponse!
    deleteAppointmentMessage(appointmentId: Int!): MutationResponse!
    acceptAppointment(appointmentId: Int!): MutationResponse!
    saveRecord(recordInput: RecordInput!): MutationResponse!
    deleteRecord(recordId: Int!): MutationResponse!
    saveDoctor(doctorRequestId: Int!): MutationResponse!
    deleteDoctorRequest(doctorRequestId: Int!): MutationResponse!
  }

  type Paged {
    slice: [Paginated!]!
    length: Int!
  }

  type CalendarSlice {
    monthSlice: [Appointment!]!
  }

  type MutationResponse {
    success: Boolean!
    message: String!
  }

  type LoginResponse {
    token: String!
    expiresAt: Date!
  }

  type NextAppointmentResponse {
    nextStart: Date
    nextEnd: Date
    nextId: Int
    patient: User
    doctor: User
  }

  type RecordCountResponse {
    countRecords: Int!
    countDrafts: Int!
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
  }

  type Appointment {
    id: Int!
    doctorId: Int
    patientId: Int
    createdAt: Date!
    updatedAt: Date
    start: Date!
    end: Date!
    allDay: Boolean
    patient: User
    doctor: User
    patientMessage: String
    doctorMessage: String
    record: Record
  }

  type Record {
    id: Int!
    title: String
    text: String
    createdAt: Date!
    updatedAt: Date!
    appointmentId: Int!
    appointment: Appointment!
    draft: Boolean
  }

  type DoctorRequest {
    id: Int!
    createdAt: Date!
    updatedAt: Date
    email: String!
    firstName: String!
    lastName: String!
    userRoleId: Int!
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
    doctorMessage: String
    patientMessage: String
    patientId: Int
  }

  input RecordInput {
    id: Int
    title: String
    text: String
    appointmentId: Int
    draft: Boolean
  }

  input DoctorRequestInput {
    updatedAt: Date
    email: String!
    firstName: String!
    lastName: String!
    userRoleId: Int! 
  }
`

export const typeDefs = gql(schema);


