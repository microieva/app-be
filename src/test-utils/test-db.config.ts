import { Appointment } from 'src/graphql/appointment/appointment.model';
import { Chat } from 'src/graphql/chat/chat.model';
import { DoctorRequest } from 'src/graphql/doctor-request/doctor-request.model';
import { Message } from 'src/graphql/message/message.model';
import { Record } from 'src/graphql/record/record.model';
import { UserRole } from 'src/graphql/user/user-role.model';
import { User } from 'src/graphql/user/user.model';
import { DataSource } from 'typeorm';


export const testDataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    dropSchema: true,
    entities: [User, UserRole, Chat, Message, Record, Appointment, DoctorRequest],
    synchronize: true,
    logging: false,
});


// beforeAll(async () => {
//     await testDataSource.initialize();
// });
  
// afterAll(async () => {
//     await testDataSource.destroy();
// });
