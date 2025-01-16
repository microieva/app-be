import 'dotenv/config'; 
import nodemailer, { TransportOptions } from "nodemailer";
import { DateTime } from "luxon";
import { Appointment } from "../graphql/appointment/appointment.model";
import { Record } from "../graphql/record/record.model";
import { DoctorRequest } from '../graphql/doctor-request/doctor-request.model';
import { User } from '../graphql/user/user.model';
import { Feedback } from '../graphql/feedback/feedback.model';

interface Options {
    host: string,
    port: number,
    auth: {
        user: string,
        pass: string
    }
} 

const transporter = nodemailer.createTransport<Options>({
    host: process.env.EMAIL_NOTIFICATION_HOST,
    port: process.env.EMAIL_NOTIFICATION_PORT,
    auth: {
        user: process.env.EMAIL_NOTIFICATION_USER,
        pass: process.env.EMAIL_NOTIFICATION_PASS
    }
} as TransportOptions);

type AppEntity = Appointment | Record | DoctorRequest | User | Feedback;

export const sendEmailNotification = (entity: AppEntity, notification: string): void => {
    switch (notification) {
        case 'appointmentAccepted':
            sendNotificationAppointmentAccepted(entity as Appointment);
            break;
        case 'appointmentDeleted':
            sendNotificationAppointmentDeleted(entity as Appointment);
            break;
        case 'appointmentUpdated':
            sendNotificationAppointmentUpdated(entity as Appointment);
            break;
        case 'recordSaved':
            sendNotificationRecordSaved(entity as Record);
            break;
        case 'newDoctorRequestCreated':
            sendNotificationNewDoctorRequestCreated(entity as DoctorRequest);
            break;
        case 'doctorAccountActivated':
            sendNotificationDoctorAccountActivated(entity as User);
            break;
        case 'appointmentMessageAddedByDoctor':
            sendNotificationAppointmentMessageAddedByDoctor(entity as Appointment);
            break;
        case 'appointmentMessageAddedByPatient':
            sendNotificationAppointmentMessageAddedByPatient(entity as Appointment);
            break;
        case 'unacceptedAppointment':
            sendNotificationAppointmentUnaccepted(entity as Appointment);
            break;
        case 'feedbackCreated':
            sendNotificationFeedbackCreated(entity as Feedback);
            break;
        default:
            break;
    }
};
const sendNotificationFeedbackCreated = (dbFeedback:Feedback) :void=> {
    const mailOptions = {
        from: process.env.EMAIL_NOTIFICATION_SENDER_ID,
        to: 'ieva.vyliaudaite@me.com', 
        subject: 'FEEDBACK',
        text: `Feedback info:, 
            \nName: ${dbFeedback.name}
            \nEmail: ${dbFeedback.email}
            \nText: ${dbFeedback.text}`
    };

    transporter.sendMail(mailOptions, (error, info: any) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('FEEDBACK CREATED Email sent:', info.response);
        }
    });
}
const sendNotificationAppointmentUnaccepted = (dbAppointment: Appointment): void => {

    const mailOptions = {
        from: process.env.EMAIL_NOTIFICATION_SENDER_ID,
        to: `${dbAppointment.patient.email}`, 
        subject: 'Appointment cancelled',
        text: `Dear ${dbAppointment.patient.firstName} ${dbAppointment.patient.lastName}, 
            \nDoctor ${dbAppointment.doctor.firstName} ${dbAppointment.doctor.lastName} have cancelled the appointment
            \nAppointment time: ${DateTime.fromJSDate(new Date(dbAppointment.start)).toFormat('MMM dd, hh:mm a')}
            \nWe appologize for any inconvenience. Currently the appointment is in appointment requests and might be accepted by another doctor as soon as possible. In case of an urgent matter, please call our frontdesk.`
    };

    transporter.sendMail(mailOptions, (error, info: any) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('APPOINTMENT CANCELLED BY DOCTOR Email sent:', info.response);
        }
    });
};

const sendNotificationAppointmentMessageAddedByPatient = (dbAppointment: Appointment): void => {

    const mailOptions = {
        from: process.env.EMAIL_NOTIFICATION_SENDER_ID,
        to: `${dbAppointment.doctor.email}`, 
        subject: 'Message added by patient',
        text: `Dear Dr ${dbAppointment.doctor.firstName} ${dbAppointment.doctor.lastName}, 
            \nPatient ${dbAppointment.patient.firstName} ${dbAppointment.patient.lastName} add following message:
            \n"${dbAppointment.patientMessage}".
            \nAppointment time: ${DateTime.fromJSDate(new Date(dbAppointment.start)).toFormat('MMM dd, hh:mm a')}`
    };

    transporter.sendMail(mailOptions, (error, info: any) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('APPOINTMENT MESSAGE BY PATIENT Email sent:', info.response);
        }
    });
};

const sendNotificationAppointmentMessageAddedByDoctor = (dbAppointment: Appointment): void => {

    const mailOptions = {
        from: process.env.EMAIL_NOTIFICATION_SENDER_ID,
        to: `${dbAppointment.patient.email}`, 
        subject: 'Message added by doctor',
        text: `Dear ${dbAppointment.patient.firstName} ${dbAppointment.patient.lastName}, 
            \nDoctor ${dbAppointment.doctor.firstName} ${dbAppointment.doctor.lastName} add following message:
            \n"${dbAppointment.doctorMessage}".
            \nAppointment time: ${DateTime.fromJSDate(new Date(dbAppointment.start)).toFormat('MMM dd, hh:mm a')}`
    };

    transporter.sendMail(mailOptions, (error, info: any) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('APPOINTMENT MESSAGE BY DOCTOR Email sent:', info.response);
        }
    });
};

const sendNotificationDoctorAccountActivated = (dbUser: User): void => {
    const mailOptions = {
        from: process.env.EMAIL_NOTIFICATION_SENDER_ID,
        to: `${dbUser.email}`,
        subject: 'Health Center Access Activated',
        text: `Dear Doctor ${dbUser.firstName} ${dbUser.lastName}, 
            \nYour doctor access account has been activated. 
            \nUse email ${dbUser.email} address to log in to your Health Center account. Once logged in, please update user information to gain access to full features.`
    };

    transporter.sendMail(mailOptions, (error, info: any) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('ACCOUNT ACTIVATED Email sent:', info.response);
        }
    });
}

const sendNotificationNewDoctorRequestCreated = (dbDocRequest: DoctorRequest): void => {
    const mailOptions = {
        from: process.env.EMAIL_NOTIFICATION_SENDER_ID,
        to: "ieva.vyliaudaite@me.com", // to admin 
        subject: 'New Doctor Account Activation Request',
        text: `Dear admin, 
            \nNew doctor account activation request has been created. 
            \nDoctor ${dbDocRequest.firstName} ${dbDocRequest.firstName} with email address ${dbDocRequest.email} is ready for Doctor role access.`
    };

    transporter.sendMail(mailOptions, (error, info: any) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('NEW DOCTOR ACCOUNT REQUEST Email sent:', info.response);
        }
    });
}

const sendNotificationAppointmentAccepted = (dbAppointment: Appointment): void => {

    const mailOptions = {
        from: process.env.EMAIL_NOTIFICATION_SENDER_ID,
        to: `${dbAppointment.patient.email}`, 
        subject: 'Your Appointment Confirmed',
        text: `Dear ${dbAppointment.patient.firstName} ${dbAppointment.patient.lastName}, 
            \nYour Health Center appointment confirmed. 
            \nDoctor ${dbAppointment.doctor.firstName} ${dbAppointment.doctor.lastName} will see you on ${DateTime.fromJSDate(new Date(dbAppointment.start)).toFormat('MMM dd, hh:mm a')}`
    };

    transporter.sendMail(mailOptions, (error, info: any) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('APPOINTMENT ACCEPTED Email sent:', info.response);
        }
    });
};

const sendNotificationAppointmentDeleted = (deletedAppointment: Appointment): void => {

    const mailOptions = {
        from: process.env.EMAIL_NOTIFICATION_SENDER_ID,
        to: `${deletedAppointment.doctor.email}`, 
        subject: 'Deleted Appointment',
        text: `Dear Doctor ${deletedAppointment.doctor.firstName} ${deletedAppointment.doctor.lastName}, 
            \nAppointment of ${DateTime.fromJSDate(new Date(deletedAppointment.start)).toFormat('MMM dd, hh:mm a')} has been cancelled by patient ${deletedAppointment.patient.firstName} ${deletedAppointment.patient.lastName}`
    };

    transporter.sendMail(mailOptions, (error, info: any) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('APPOINTMENT CANCELLED Email sent:', info.response);
        }
    });
}


const sendNotificationAppointmentUpdated = (updatedAppointment: Appointment): void => {

    const mailOptions = {
        from: process.env.EMAIL_NOTIFICATION_SENDER_ID,
        to: `${updatedAppointment.patient.email}`, 
        subject: 'Appointment Time Changed',
        text: `Dear ${updatedAppointment.patient.firstName} ${updatedAppointment.patient.lastName}, 
            \nAppointment time has been changed to ${DateTime.fromJSDate(new Date(updatedAppointment.start)).toFormat('MMM dd, hh:mm a')} by Doctor ${updatedAppointment.doctor.firstName} ${updatedAppointment.doctor.lastName}`
    };

    transporter.sendMail(mailOptions, (error, info: any) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('APPOINTMENT UPDATED Email sent:', info.response);
        }
    });
}


const sendNotificationRecordSaved = (dbRecord: Record): void => {

    const recipient = dbRecord.appointment.patient.email;
    const patientName = dbRecord.appointment.patient.firstName+" "+dbRecord.appointment.patient.lastName;

    const mailOptions = {
        from: process.env.EMAIL_NOTIFICATION_SENDER_ID,
        to: `${recipient}`, 
        subject: 'New Medical Record Open for Access',
        text: `Dear ${patientName}, 
            \nNew medical record has been saved. Please login to your account to access it.`};

    transporter.sendMail(mailOptions, (error, info: any) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('RECORD SAVED Email sent:', info.response);
        }
    });
};





