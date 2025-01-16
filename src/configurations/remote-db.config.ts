import 'dotenv/config'; 
import "reflect-metadata";
import { DataSource } from 'typeorm';
import { UserRole } from '../graphql/user/user-role.model';
import { User } from '../graphql/user/user.model';
import { Appointment } from '../graphql/appointment/appointment.model';
import { Record } from '../graphql/record/record.model';
import { DoctorRequest } from '../graphql/doctor-request/doctor-request.model';
import { Chat } from '../graphql/chat/chat.model';
import { Message } from '../graphql/message/message.model';
import { ChatParticipant } from '../graphql/chat-participant/chat-participant.model';
import { Feedback } from '../graphql/feedback/feedback.model';

export const remoteDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username:  process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [
        UserRole,
        User,
        Appointment,
        Record,
        DoctorRequest,
        Chat,
        Message,
        ChatParticipant,
        Feedback
    ],
    connectTimeout: 300000, 
    extra: {
        keepAlive: true,
        connectTimeout: 300000, 
        acquireTimeout: 300000 
    }
});