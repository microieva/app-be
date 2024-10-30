import { DateTime } from "luxon";

export const mockUserRoles = [
    {
      id: 1,
      userRole: 'admin'
    },
    {
      id: 2,
      userRole: 'doctor'
    },
    {
        id: 3,
        userRole: 'patient'
      }
];

  export const mockUsers = [
    {
      id: 1,
      firstName: 'Admin',
      lastName: 'Adams',
      userRoleId: 1, 
      phone: '1234567890',
      email: 'admin@example.com',
      password: 'password123',
      dob: new Date('1990-01-01'),
      streetAddress: '123 Main St',
      city: 'Anytown',
      postCode: '12345',
      lastLogInAt: new Date('2024-10-25T00:00:00Z')
    },
    {
      id: 2,
      firstName: 'Doctor',
      lastName: 'House',
      userRoleId: 2,
      phone: '0987654321',
      email: 'doctor@email.com',
      password: 'password123',
      dob: new Date('1991-02-02'),
      streetAddress: '456 Main St',
      city: 'Newtown',
      postCode: '67890',
      lastLogInAt: new Date('2024-10-26T00:00:00Z')
    },
    {
        id: 3,
        firstName: 'Patient',
        lastName: 'John',
        userRoleId: 3,
        phone: '0987654321',
        email: 'patient@email.com',
        password: 'password123',
        dob: new Date('1991-02-02'),
        streetAddress: '456 Main St',
        city: 'Newtown',
        postCode: '67890',
        lastLogInAt: new Date('2024-10-26T00:00:00Z')
      }
];

export const mockAppointments = [
    {
        id: 1,
        patientId: 3,
        doctorId: 2,
        createdAt: new Date(DateTime.local().toISO()),
        updatedAt: new Date(DateTime.local().toISO()),
        start: new Date(DateTime.local().plus({ days: 1 }).toISO()),
        end: new Date(DateTime.local().plus({ days: 1, hours: 1 }).toISO()),
        allDay: false,
        patientMessage: 'Initial consultation.',
        doctorMessage: 'Discuss treatment plan.',
        recordId: null,
        patient: null, // Mocking patient as null; ideally link a mock User with id 3 here
        doctor: null,  // Mocking doctor as null; ideally link a mock User with id 2 here
        record: null,  // Mocking record as null; ideally link a mock Record if needed
    },
    {
        id: 2,
        patientId: 3,
        doctorId: 2,
        createdAt: new Date(DateTime.local().toISO()),
        updatedAt: new Date(DateTime.local().toISO()),
        start: new Date(DateTime.local().plus({ days: 2 }).toISO()),
        end: new Date(DateTime.local().plus({ days: 2, hours: 1 }).toISO()),
        allDay: false,
        patientMessage: 'Follow-up session.',
        doctorMessage: 'Review test results.',
        recordId: null,
        patient: null, // Mocking patient as null; ideally link a mock User with id 3 here
        doctor: null,  // Mocking doctor as null; ideally link a mock User with id 2 here
        record: null,  // Mocking record as null; ideally link a mock Record if needed
    }
];

export const mockRecords = [
    {
        id: 1,
        title: 'Initial Consultation Notes',
        text: 'Patient reported mild symptoms. Discussed preliminary treatment options.',
        createdAt: new Date(DateTime.local().toISO()),
        updatedAt: new Date(DateTime.local().toISO()),
        appointmentId: 1,  // Links to the first appointment
        patientId: 3,
        doctorId: 2,
        draft: false,
        patient: null,  // Mocking as null; ideally link a mock User object with id 3 here
        doctor: null,   // Mocking as null; ideally link a mock User object with id 2 here
        appointment: null, // Mocking as null; ideally link mock appointment if needed
    },
    {
        id: 2,
        title: 'Follow-Up Session Notes',
        text: 'Reviewed test results. Patient to continue current treatment.',
        createdAt: new Date(DateTime.local().toISO()),
        updatedAt: new Date(DateTime.local().toISO()),
        appointmentId: 2,  // Links to the second appointment
        patientId: 3,
        doctorId: 2,
        draft: false,
        patient: null,  // Mocking as null; ideally link a mock User object with id 3 here
        doctor: null,   // Mocking as null; ideally link a mock User object with id 2 here
        appointment: null, // Mocking as null; ideally link mock appointment if needed
    }
];

export const mockDoctorRequests = [
  {
    id: 1,
    email: 'jane.doe@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    userRoleId: 2,
    createdAt: new Date('2023-08-15')
  },
  {
    id: 2,
    email: 'john.smith@example.com',
    firstName: 'John',
    lastName: 'Smith',
    userRoleId: 2,
    createdAt: new Date('2023-08-16')
  },
];

export const testDoctorRequest = {
    id: 3,
    email: 'tom.smith@example.com',
    firstName: 'Tom',
    lastName: 'Smith',
    userRoleId: 2,
    createdAt: new Date('2023-08-16')
}



  
