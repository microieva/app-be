import 'dotenv/config'; 
import nodemailer, { TransportOptions } from "nodemailer";
import { DateTime } from "luxon";
import { Appointment } from "../graphql/appointment/appointment.model";
import { Record } from "../graphql/record/record.model";

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

export const sendEmailNotification = (entity: Appointment | Record, notification: string): void => {
    switch (notification) {
        case 'appointmentAccepted':
            sendNotificationAppointmentAccepted(entity as Appointment);
            break;
        case 'appointmentCancelled':
            sendNotificationAppointmentCancelled(entity as Appointment);
            break;
        case 'appointmentUpdated':
            sendNotificationAppointmentUpdated(entity as Appointment);
            break;
        case 'recordSaved':
            sendEmailNotificationRecordSaved(entity as Record);
            break;
    }
};

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

const sendNotificationAppointmentCancelled = (deletedAppointment: Appointment): void => {

    const mailOptions = {
        from: process.env.EMAIL_NOTIFICATION_SENDER_ID,
        to: `${deletedAppointment.doctor.email}`, 
        subject: 'Cancelled Appointment',
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


const sendEmailNotificationRecordSaved = (dbRecord: Record): void => {

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





