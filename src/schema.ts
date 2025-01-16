import { gql } from "graphql-tag";

export const schema = `
  scalar Date
  scalar Void

  union Paginated = Appointment | Record | User | DoctorRequest | Feedback

  type Query {
    me: User
    user(userId: Int!): User
    request(userId: Int!): DoctorRequest
    doctors(
      pageIndex: Int! 
      pageLimit: Int!
      sortActive: String 
      sortDirection: String
      filterInput: String
    ): Paged!
    patients(
      pageIndex: Int! 
      pageLimit: Int! 
      sortActive: String 
      sortDirection: String
      filterInput: String
    ): Paged!
    requests(
      pageIndex: Int! 
      pageLimit: Int! 
      sortActive: String 
      sortDirection: String
      filterInput: String
    ): Paged!
    medicalRecordsFromIds(
      ids: [Int!]!
      pageIndex: Int! 
      pageLimit: Int! 
      sortActive: String 
      sortDirection: String
      filterInput: String
      advancedSearchInput: AdvancedSearchInput
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
      pageIndex: Int! 
      pageLimit: Int!
      sortActive: String 
      sortDirection: String
      filterInput: String
    ): Paged!
    upcomingAppointments (
      pageIndex: Int! 
      pageLimit: Int! 
      sortActive: String 
      sortDirection: String
      filterInput: String
    ): Paged!
    pastAppointments (
      pageIndex: Int! 
      pageLimit: Int!
      sortActive: String 
      sortDirection: String
      filterInput: String
    ): Paged!
    isReservedDay(date: Date!):Boolean
    countPendingAppointments: Int!
    countUpcomingAppointments: Int!
    countPastAppointments: Int!
    nextAppointment: NextAppointmentResponse
    record(recordId: Int, appointmentId: Int): Record
    records(
      pageIndex: Int!
      pageLimit: Int! 
      sortActive: String 
      sortDirection: String
      filterInput: String
      advancedSearchInput: AdvancedSearchInput
    ): Paged!
    drafts(
      pageIndex: Int! 
      pageLimit: Int!
      sortActive: String 
      sortDirection: String
      filterInput: String
      advancedSearchInput: AdvancedSearchInput
    ): Paged!
    countDoctorRequests: Int!
    countDoctors: Int!
    countPatients: Int!
    countMissedAppointments: Int!
    countTodayAppointments: Int!
    countTotalHoursToday: String!
    countRecords: Int!
    countDrafts: Int!
    chatId (receiverId: Int): Int!
    chatMessages(chatId: Int!): [Message!]!
    messages(chatId: Int!): [Message!]!
    countUnreadMessages: Int!
    countAllUnreadMessages: [CountAllUnreadMessages]
    feedbacks (
      pageIndex: Int! 
      pageLimit: Int!
      sortActive: String 
      sortDirection: String
      filterInput: String
    ): Paged!
    countFeedback: Int!
    countUnreadFeedback: Int!
    feedback(feedbackId: Int!): Feedback
  }

  type Mutation {
    saveUser(userInput: UserInput!): MutationResponse!
    deleteUser(userId: Int!): MutationResponse!
    logOut: Void
    login(directLoginInput: LoginInput!): LoginResponse!
    loginWithGoogle(googleCredential: String!): LoginResponse!
    loginWithSignicat(signicatAccessToken: String!): LoginResponse!
    saveAppointment(appointmentInput: AppointmentInput!): MutationResponse!
    deleteAppointment(appointmentId: Int!): MutationResponse!
    saveAppointmentMessage(appointmentId: Int!, appointmentMessage: String!): MutationResponse!
    deleteAppointmentMessage(appointmentId: Int!): MutationResponse!
    acceptAppointment(appointmentId: Int!): MutationResponse!
    saveRecord(recordInput: RecordInput!): MutationResponse!
    deleteRecord(recordId: Int!): MutationResponse!
    saveDoctor(doctorRequestId: Int!): MutationResponse!
    saveChatMessage(chatId: Int!, content: String!): Message!
    deleteChatForParticipant(chatId: Int!): MutationResponse!
    setIsReadToTrue(chatId: Int!): MutationResponse!
    acceptAppointmentsByIds(appointmentIds: [Int!]): MutationResponse!
    unacceptAppointmentsByIds(appointmentIds: [Int!]): MutationResponse!
    deleteAppointmentsByIds(appointmentIds: [Int!]): MutationResponse!
    addMessageToAppointmentsByIds(appointmentIds: [Int!], message: String!): MutationResponse!
    deleteMessagesFromAppointmentsByIds(appointmentIds: [Int!]): MutationResponse!
    deleteRecordsByIds(recordIds: [Int!]): MutationResponse!
    saveRecordsAsFinalByIds(recordIds:[Int!]): MutationResponse!
    deactivateDoctorAccountsByIds(userIds:[Int!]): MutationResponse!
    saveDoctorsByIds(userIds:[Int!]): MutationResponse!
    deleteDoctorRequestsByIds(userIds:[Int!]): MutationResponse!
    saveFeedback(feedbackInput:FeedbackInput!): MutationResponse!
    markAsReadFeedbacks(feedbackIds:[Int!]): MutationResponse!
    deleteFeedbacksByIds(feedbackIds:[Int!]): MutationResponse!

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
    data: Appointment
  }

  type LoginResponse {
    token: String!
    expiresAt: Date!
  }

  type NextAppointmentResponse {
    nextStart: Date
    nextEnd: Date
    nextId: Int
    previousAppointmentDate: Date
    recordIds: [Int!]
    patient: User
    doctor: User
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
    lastLogOutAt: Date
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
    recordId: Int
  }

  type Record {
    id: Int!
    title: String
    text: String
    createdAt: Date!
    updatedAt: Date
    appointmentId: Int
    appointment: Appointment
    draft: Boolean!
    patientId: Int!
    doctorId: Int
    patient: User!
    doctor: User
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
  
  type Chat {
    id: Int!
    participants: [User!]!
    messages: [Message!]!
  }
  
  type Message {
    id: Int!
    content: String!
    isRead: Boolean!
    createdAt: Date!
    sender: User!
    chat: Chat!
  }
  type ChatParticipant {
    id: Int!
    chat: Chat!
    participant: User!
    deletedAt: Date
  }

  type CountAllUnreadMessages {
    senderId: Int!
    count: Int!
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

  input AdvancedSearchInput {
    rangeStart: Date
    rangeEnd: Date
    titleLike: String
    textLike: String
  }

  type Feedback {
    id:Int!
    name:String
    email:String
    text:String!
    createdAt:Date!
    isRead:Boolean!
  }
  
  input FeedbackInput {
    text: String!
    name: String
    email:String
  }
`

export const typeDefs = gql(schema);


