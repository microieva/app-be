import "reflect-metadata";
import 'dotenv/config'; 
import { DataSource } from 'typeorm';
import { UserRole } from '../../graphql/user/user-role.model';
import { User } from '../../graphql/user/user.model';
import { Appointment } from '../../graphql/appointment/appointment.model';
import { Record } from '../../graphql/record/record.model';
import { DoctorRequest } from '../../graphql/doctor-request/doctor-request.model';
import { Chat } from '../../graphql/chat/chat.model';
import { Message } from '../../graphql/message/message.model';
import { ChatParticipant } from '../../graphql/chat-participant/chat-participant.model';
import { Feedback } from '../../graphql/feedback/feedback.model';
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";

const options: MysqlConnectionOptions = {
    type: 'mysql',
    driver: require('mysql2'),
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
    synchronize:false
};
export const prodDataSource = new DataSource(options);
