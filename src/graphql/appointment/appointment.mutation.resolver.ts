import { DateTime } from "luxon";
import nodemailer from "nodemailer";
import { Not, IsNull } from "typeorm";
import { User } from "../user/user.model";
import { Appointment } from "./appointment.model";
import { AppointmentInput } from "./appointment.input";
import { AppContext, MutationResponse } from "../types"

export const appointmentMutationResolver = {
    Mutation: {
        saveAppointment: async (parent: null, args: any, context: AppContext) => {
            const input: AppointmentInput = args.appointmentInput;
            const dbMe = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});

            if (!dbMe) {
                return {
                    success: false,
                    message: 'Unauthorized action'
                } as MutationResponse;
            }

            const repo = context.dataSource.getRepository(Appointment);

            const inputStart = DateTime.fromJSDate(new Date(input.start));
            const startOfDay = inputStart.startOf('day').toJSDate();
            const endOfDay = inputStart.endOf('day').toJSDate();

            const queryBuilder = repo
                .createQueryBuilder('appointment')
                .where('appointment.start BETWEEN :startOfDay AND :endOfDay', {
                    startOfDay,
                    endOfDay
                });

            if (dbMe.userRoleId === 3) {
                queryBuilder
                    .andWhere('appointment.patientId = :patientId', { patientId: context.me.userId });
            } else if (dbMe.userRoleId === 2) {
                queryBuilder
                    .andWhere('appointment.doctorId = :doctorId', { doctorId: context.me.userId });
            } else {
                queryBuilder
                    .andWhere('appointment.patientId = :patientId', { patientId: input.patientId });
            }

            const isReserved = await queryBuilder
                .andWhere({updatedAt: Not(IsNull())})
                .getExists();

            console.log('IS RESERVED:  ', isReserved)

            if (input.id) {
                const dbAppointment = await repo.findOneBy({id: input.id});
                dbAppointment.id = input.id;
                dbAppointment.start = new Date(input.start);
                dbAppointment.end = new Date(input.end);
                dbAppointment.allDay;
                if (dbMe.userRoleId === 3) {
                    if (dbAppointment.doctorId) {
                        return {
                            success: false,
                            message: 'Forbidden action: the appointment cannot be moved because it has been already accepted... Consider cancelling and making a new one on more suitable date.'
                        } as MutationResponse;
                    }
                    dbAppointment.patientId = dbMe.id;
                } else if (dbMe.userRoleId === 2){
                    dbAppointment.doctorId = dbMe.id;
                } else {
                    dbAppointment.patientId = input.patientId;
                    dbAppointment.updatedAt = null;
                }

                try {
                    await repo.save(dbAppointment);
                    return {
                        success: true,
                        message: 'Appointment updated'
                    } as MutationResponse;
                } catch (error) {
                    return {
                        success: false,
                        message: 'Unexpected error while updating appointment: '+error
                    } as MutationResponse;
                }
            } else {
                /*if (isReserved) {
                    return {
                        success: false,
                        message: 'Time overlap!'
                    } as MutationResponse;
                } */
                const newAppointment = new Appointment();
                newAppointment.start =  new Date(input.start);
                newAppointment.end =  new Date(input.end);
                newAppointment.allDay = input.allDay;

                if (dbMe.userRoleId === 3) {
                    if (input.allDay) {
                        return {
                            success: false,
                            message: 'Unauthorized action'
                        } as MutationResponse;
                    }
                    newAppointment.patientId = dbMe.id;
                    newAppointment.updatedAt = null;
                    newAppointment.patientMessage = input.patientMessage;
                } else if (dbMe.userRoleId === 2){
                    newAppointment.doctorId = dbMe.id;
                    newAppointment.doctorMessage = input.doctorMessage;
                } else {
                    newAppointment.patientId = input.patientId;
                    newAppointment.updatedAt = null;
                    newAppointment.patientMessage = input.patientMessage;
                }

                try {
                    await repo.save(newAppointment);      
                    return {
                        success: true,
                        message: 'Appointment created'
                    } as MutationResponse;
                } catch (error) {
                    return {
                        success: false,
                        message: 'Unexpected error while creating appointment: '+error
                    } as MutationResponse;
                }    
            }
        },
        deleteAppointment: async (parent: null, args: any, context: AppContext) => {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            
            if (!dbMe) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse;
            } else {
                const id = args.appointmentId;
                const repo = context.dataSource.getRepository(Appointment);

                try {
                    await repo.delete({id});
                    return {
                        success: true,
                        message: "Appointment deleted"
                    } as MutationResponse;
                } catch (error) {
                    return {
                        success: false,
                        message: "Error while deleting appointment: "+ error
                    } as MutationResponse;
                }
            }
        },
        saveAppointmentMessage: async(parent: null, args: any, context: AppContext)=> {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);

            const id = args.appointmentId;
            const message = args.appointmentMessage;

            if (!dbMe) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse;
            }

            const dbAppointment = await repo.findOneBy({id});

            if (!dbAppointment) {
                return {
                    success: false,
                    message: "Appointment not found"
                } as MutationResponse;
            }
            try {
                if (dbMe.userRoleId === 3) {
                    dbAppointment.patientMessage = message;
                    if (!dbAppointment.updatedAt) {
                        dbAppointment.updatedAt = null; 
                    }
                } else if (dbMe.userRoleId === 2){
                    dbAppointment.doctorMessage = message;
                    if (!dbAppointment.updatedAt) {
                        dbAppointment.updatedAt = null; 
                    }
                } else {
                    dbAppointment.patientMessage = message;
                    if (!dbAppointment.updatedAt) {
                        dbAppointment.updatedAt = null; 
                    }
                }
                await repo.save(dbAppointment);
                return {
                    success: true,
                    message: "Message saved"
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: "Error saving appointment message: "+error
                } as MutationResponse;
            }

        },
        deleteAppointmentMessage: async (parent: null, args: any, context: AppContext)=> {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const id = args.appointmentId;

            if (!dbMe) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse;
            }

            const dbAppointment = await repo.findOneBy({id});

            if (!dbAppointment) {
                return {
                    success: false,
                    message: "Appointment not found"
                } as MutationResponse;
            }
            try {
                if (dbMe.userRoleId === 2) {
                    dbAppointment.doctorMessage = null;
                } else {
                    dbAppointment.patientMessage = null;
                }
                await repo.save(dbAppointment);
                return {
                    success: true,
                    message: "Message removed"
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: "Error removing appointment message: "+error
                } as MutationResponse;
            }
        },
        acceptAppointment: async (parent: null, args: any, context: AppContext) => {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const dbAppointment = await repo.findOneBy({id: args.appointmentId});

            if (!dbMe || dbMe.userRoleId !== 2) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse
            }

            if (!dbAppointment) {
                return {
                    success: false,
                    message: "Appointment not found"
                } as MutationResponse
            }

            try {
                dbAppointment.doctorId = dbMe.id;
                await repo.save(dbAppointment);

                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'empathichealthcenter@gmail.com',
                        pass: 'Integrify1234'
                    }
                });
                const mailOptions = {
                    from: 'empathichealthcenter@gmail.com',
                    to: "ieva.vyliaudaite@me.com", // recipient's email
                    subject: 'Your Appointment Confirmed',
                    text: `Dear patient, 
                        \nYour Health Center appointment confirmed. 
                        \nAppointment time: ${DateTime.fromJSDate(dbAppointment.start).toFormat('MMM dd, hh:mm')}`
                  };
                
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      console.log('Error sending email:', error);
                    } else {
                      console.log('Email sent:', info.response);
                    }
                });

                return {
                    success: true,
                    message: "Appointment accepted. Doctor id saved"
                } as MutationResponse
            } catch (error) {
                return {
                    success: false,
                    message: "Unable to save doctor id to accept appointment: "+error
                } as MutationResponse
            }
        }
    }
}