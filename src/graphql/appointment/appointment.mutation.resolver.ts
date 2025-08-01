import { DateTime } from "luxon";
import { User } from "../user/user.model";
import { sendEmailNotification } from "../../services/email.service";
import { Appointment } from "./appointment.model";
import { AppointmentInput } from "./appointment.input";
import { AppContext, MutationResponse } from "../types"
import { getNow } from "../utils";
import {
    APPOINTMENT_CREATED, 
    APPOINTMENT_ACCEPTED, 
    APPOINTMENT_CANCELLED, 
    APPOINTMENT_UPDATED, 
    APPOINTMENT_DELETED, 
    APPOINTMENT_MESSAGE_CREATED_BY_DOCTOR, 
    APPOINTMENT_MESSAGE_CREATED_BY_PATIENT, 
    APPOINTMENT_DELETED_BY_PATIENT, 
    APPOINTMENT_DELETED_BY_DOCTOR
} from "../constants";


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
            } 

            // const isReserved = await queryBuilder
            //     .andWhere({updatedAt: Not(IsNull())})
            //     .getExists();


            if (input.id) {
                const dbAppointment = await repo
                    .createQueryBuilder('appointment')
                    .leftJoinAndSelect('appointment.patient', 'patient')
                    .leftJoinAndSelect('appointment.doctor', 'doctor')
                    .where('appointment.id = :id', {id: input.id})
                    .getOne();

                let notify: boolean = false;
                if (DateTime.fromJSDate(dbAppointment.start).toISO() !== input.start || DateTime.fromJSDate(dbAppointment.end).toISO() !== input.end) {
                    notify = true;
                }

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
                } 

                try {
                    const data = await repo.save(dbAppointment);

                    if (notify && dbMe.userRoleId === 2) {
                        sendEmailNotification(data, APPOINTMENT_UPDATED);
                        context.io.to(`patient_${data.patientId}_`).emit(APPOINTMENT_UPDATED, {
                            event: APPOINTMENT_UPDATED,
                            message:"Your upointment has been updated",
                            data
                        })
                    } 

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
                const dbAppointment = await repo
                    .createQueryBuilder('appointment')
                    .where('appointment.start = :start', {start: input.start})
                    .getOne();
                if (dbAppointment) {
                    return {
                        success: false,
                        message: 'Appointment already exists'
                    } as MutationResponse;
                }
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
                    const appointment = await repo.save(newAppointment);   
                    if (input.allDay === false) {
                        context.io.to('doctors').emit(APPOINTMENT_CREATED, { 
                            event: APPOINTMENT_CREATED,
                            message: 'New appointment request',
                            data: appointment
                        });
                    }
                    return {
                        success: true,
                        message: 'Appointment created',
                        data: appointment
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
            const id = args.appointmentId;
            const repo = context.dataSource.getRepository(Appointment);
            const now = getNow(); 

            if (!dbMe) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse;
            } else {
                try {
                    const emailInfo = await repo
                        .createQueryBuilder('appointment')
                        .leftJoinAndSelect('appointment.patient', 'patient')
                        .leftJoinAndSelect('appointment.doctor', 'doctor')
                        .where('appointment.id = :id', {id})
                        .getOne();

                    await repo.delete({id});

                    if (emailInfo.doctor && emailInfo.end > now && dbMe.userRoleId !== 2) {
                        sendEmailNotification(emailInfo, APPOINTMENT_DELETED);    
                    }

                    return {
                        success: true,
                        message: "Appointment deleted",
                        data: {
                            start: emailInfo.start,
                            doctorId: emailInfo.doctorId
                        } as Appointment
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

            try {
                if (dbMe.userRoleId === 2) {
                    await repo.update(id, {doctorMessage:message});
                    const data = await repo
                        .createQueryBuilder('appointment')
                        .leftJoinAndSelect('appointment.doctor', 'doctor')
                        .leftJoinAndSelect('appointment.patient', 'patient')
                        .where({id})
                        .getOne();
                    
                    sendEmailNotification(data, APPOINTMENT_MESSAGE_CREATED_BY_DOCTOR);
                    context.io.to(`patient_${data.patientId}`).emit(APPOINTMENT_UPDATED, {
                        event: APPOINTMENT_UPDATED,
                        message:"Additional information added to your appointment",
                        data
                    });
                } else {
                    await repo.update(id, {patientMessage:message});
                    const data = await repo
                        .createQueryBuilder('appointment')
                        .leftJoinAndSelect('appointment.doctor', 'doctor')
                        .leftJoinAndSelect('appointment.patient', 'patient')
                        .where({id})
                        .getOne();

                    sendEmailNotification(data, APPOINTMENT_MESSAGE_CREATED_BY_PATIENT);
                    context.io.to(`doctor_${data.doctorId}`).emit(APPOINTMENT_UPDATED, {
                        event: APPOINTMENT_UPDATED,
                        message:"Patient added additional information to your appointment",
                        data
                    });
                }

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
                if (dbMe.userRoleId === 3) {
                    context.io.to(`doctor_${dbAppointment.doctorId}`).emit(APPOINTMENT_UPDATED, {
                        event: APPOINTMENT_UPDATED
                    });
                }
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
            
            const dbAppointment = await repo
                .createQueryBuilder('appointment')
                .leftJoinAndSelect('appointment.patient', 'patient')
                .where({id: args.appointmentId})
                .getOne();

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
                await repo.update(args.appointmentId, {doctorId: dbMe.id}); 

                const data = await repo
                    .createQueryBuilder('appointment')
                    .leftJoinAndSelect('appointment.patient', 'patient')
                    .leftJoinAndSelect('appointment.doctor', 'doctor')
                    .where({id: args.appointmentId})
                    .getOne();
                
                context.io.to(`patient_${data.patientId}`).emit(APPOINTMENT_ACCEPTED, {
                    event: APPOINTMENT_ACCEPTED,
                    message: 'Your appointment has been accepted',
                    data: dbAppointment
                });

                sendEmailNotification(data, APPOINTMENT_ACCEPTED);

                return {
                    success: true,
                    message: "Appointment accepted. Doctor id saved",
                    data: dbAppointment
                } as MutationResponse
            } catch (error) {
                return {
                    success: false,
                    message: "Unable to save doctor id to accept appointment: "+error
                } as MutationResponse
            }
        },
        acceptAppointmentsByIds: async (parent: null, args: { appointmentIds: number[] }, context: AppContext) => {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({ id: context.me.userId });
            const repo = context.dataSource.getRepository(Appointment);
        
            if (!dbMe || dbMe.userRoleId !== 2) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse;
            }
        
            const dbAppointments = await repo
                .createQueryBuilder('appointment')
                .leftJoinAndSelect('appointment.patient', 'patient')
                .leftJoinAndSelect('appointment.doctor', 'doctor')
                .where('appointment.id IN (:...appointmentIds)', { appointmentIds: args.appointmentIds })
                .getMany();
        
            if (dbAppointments.length === 0) {
                return {
                    success: false,
                    message: "Appointments not found"
                } as MutationResponse;
            }
        
            try {
                dbAppointments.forEach((appointment) => {
                    appointment.doctorId = dbMe.id;
                });
        
                await repo.save(dbAppointments);
        
                dbAppointments.forEach(async (appointment) => {
                    const data = await repo
                        .createQueryBuilder('appointment')
                        .leftJoinAndSelect('appointment.patient', 'patient')
                        .leftJoinAndSelect('appointment.doctor', 'doctor')
                        .where({ id: appointment.id })
                        .getOne();
                    
                    context.io.to(`patient_${data.patientId}`).emit(APPOINTMENT_ACCEPTED, {
                        event: APPOINTMENT_ACCEPTED,
                        message: 'Your appointment has been accepted',
                        data
                    });
        
                    sendEmailNotification(data, APPOINTMENT_ACCEPTED);
                });
        
                return {
                    success: true,
                    message: `${dbAppointments.length} appointments accepted. Doctor id saved for all.`,
                    data: dbAppointments.map(appointment => ({ start: appointment.start }))
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: "Unable to save doctor id to accept appointments: " + error
                } as MutationResponse;
            }
        },

        unacceptAppointmentsByIds: async (parent: null, args: { appointmentIds: number[] }, context: AppContext) => {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({ id: context.me.userId });
            const repo = context.dataSource.getRepository(Appointment);
        
            if (!dbMe || dbMe.userRoleId !== 2) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse;
            }
        
            const dbAppointments = await repo
                .createQueryBuilder('appointment')
                .where('appointment.id IN (:...appointmentIds)', { appointmentIds: args.appointmentIds })
                .getMany();
        
            if (dbAppointments.length === 0) {
                return {
                    success: false,
                    message: "Appointments not found"
                } as MutationResponse;
            }
        
            try {
                dbAppointments.forEach((appointment) => {
                    appointment.doctorId = null;
                    appointment.doctorMessage = null;
                });

                dbAppointments.forEach(async (appointment) => {
                    const data = await repo
                        .createQueryBuilder('appointment')
                        .leftJoinAndSelect('appointment.patient', 'patient')
                        .leftJoinAndSelect('appointment.doctor', 'doctor')
                        .where({ id: appointment.id })
                        .getOne();
        
                    sendEmailNotification(data, APPOINTMENT_CANCELLED);
                    context.io.to(`patient_${data.patientId}`).emit(APPOINTMENT_CANCELLED,{
                        event: APPOINTMENT_CANCELLED,
                        message: "Appointment cancelled by doctor",
                        data
                    })
                });
                await repo.save(dbAppointments);
                return {
                    success: true,
                    message: `${dbAppointments.length} appointments returned to pending state`,
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: "Unable to save doctor id to accept appointments: " + error
                } as MutationResponse;
            }
        },
        deleteAppointmentsByIds: async (parent: null, args: { appointmentIds: number[] }, context: AppContext) => {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({ id: context.me.userId });
            const appointmentRepo = context.dataSource.getRepository(Appointment);
            //const recordRepo = context.dataSource.getRepository(Record);

            if (!dbMe) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse;
            }
        
            try {
                /*is this needed ? should be taken care of by CASCADE ??
                await recordRepo
                    .createQueryBuilder()
                    .update(Record)
                    .where('appointmentId IN (:...ids)', { ids: args.appointmentIds })
                    .set({ appointmentId: null })
                    .execute();*/

                const appointmentsToDelete = await appointmentRepo
                    .createQueryBuilder('appointment')
                    .leftJoinAndSelect('appointment.patient', 'patient')
                    .leftJoinAndSelect('appointment.doctor', 'doctor')
                    .where('appointment.id IN (:...ids)', { ids: args.appointmentIds })
                    .getMany();

                const now = getNow();

                if (dbMe.userRoleId === 3) {
                    appointmentsToDelete.forEach(async (appointment: Appointment) => {
                        const data = appointment;
                        await appointmentRepo.delete(appointment.id)
                        if (data.doctorId && appointment.end > now) {
                            sendEmailNotification(data, APPOINTMENT_DELETED_BY_PATIENT);
                            context.io.to(`doctor_${data.doctorId}`).emit(APPOINTMENT_DELETED, {
                                event: APPOINTMENT_DELETED,
                                message: "Appointment has been cancelled by the patient",
                                data
                            });
                        }
                    })
                } else {
                    // doctor can delete from the db only past appointments with med record
                    appointmentsToDelete.forEach(async (appointment: Appointment) => {    
                        if (appointment.end < now && appointment.recordId) {
                            const data = appointment;
                            await appointmentRepo.delete(appointment.id);
                            sendEmailNotification(data, APPOINTMENT_DELETED_BY_DOCTOR);
                            context.io.to(`patient_${data.patientId}`).emit(APPOINTMENT_DELETED, {
                                event: APPOINTMENT_DELETED,
                                message: "Past appointment has been deleted by the doctor",
                                data
                            });
                        }
                    })
                }
        
                return {
                    success: true,
                    message: `${args.appointmentIds.length} appointments deleted successfully`,
                    data: {
                        deletedAppointmentIds: appointmentsToDelete.map(apt => apt.id),
                    }
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: `Error deleting appointments: ${error}`
                } as MutationResponse;
            }
        },
        addMessageToAppointmentsByIds: async (parent: null, args: any, context: AppContext) => {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({ id: context.me.userId });
            const repo = context.dataSource.getRepository(Appointment);
            const { appointmentIds, message } = args;
        
            if (!dbMe || dbMe.userRoleId === 1) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse;
            }
        
            const dbAppointments = await repo
                .createQueryBuilder('appointment')
                .where('appointment.id IN (:...appointmentIds)', { appointmentIds })
                .getMany();
        
            if (dbAppointments.length === 0) {
                return {
                    success: false,
                    message: "Appointments not found"
                } as MutationResponse;
            }
        
            try {
                if (dbMe.userRoleId === 2) {
                    dbAppointments.forEach(async (appointment) => {
                        await repo.update(appointment.id, {doctorMessage:message});

                        const data = await repo
                            .createQueryBuilder('appointment')
                            .leftJoinAndSelect('appointment.patient', 'patient')
                            .leftJoinAndSelect('appointment.doctor', 'doctor')
                            .where({ id: appointment.id })
                            .getOne();

                        sendEmailNotification(data, "APPOINTMENT_MESSAGE_CREATED_BY_DOCTOR");
                        context.io.to(`patient_${appointment.patientId}`).emit(APPOINTMENT_UPDATED,{
                            event: APPOINTMENT_UPDATED,
                            message: "Doctor added additional information to your appointment",
                            data
                        });
                    });
                } else {
                    dbAppointments.forEach(async (appointment) => {
                        await repo.update(appointment.id, {patientMessage:message});

                        const data = await repo
                            .createQueryBuilder('appointment')
                            .leftJoinAndSelect('appointment.patient', 'patient')
                            .leftJoinAndSelect('appointment.doctor', 'doctor')
                            .where({ id: appointment.id })
                            .getOne();

                        sendEmailNotification(data, "APPOINTMENT_MESSAGE_CREATED_BY_PATIENT");
                        context.io.to(`doctor_${appointment.doctorId}`).emit(APPOINTMENT_UPDATED,{
                            event: APPOINTMENT_UPDATED,
                            message: "Patient added additional information to your appointment",
                            data
                        });
                    });
                }
        
                return {
                    success: true,
                    message: `Message saved in ${dbAppointments.length} appointments.`,
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: "Unable to save message in appointments: " + error
                } as MutationResponse;
            }
        },
        deleteMessagesFromAppointmentsByIds: async (parent: null, args: any, context: AppContext) => {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({ id: context.me.userId });
            const repo = context.dataSource.getRepository(Appointment);
        
            if (!dbMe || dbMe.userRoleId === 1) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse;
            }
        
            const dbAppointments = await repo
                .createQueryBuilder('appointment')
                .where('appointment.id IN (:...appointmentIds)', { appointmentIds: args.appointmentIds })
                .getMany();
        
            if (dbAppointments.length === 0) {
                return {
                    success: false,
                    message: "Appointments not found"
                } as MutationResponse;
            }
        
            try {
                if (dbMe.userRoleId === 2) {
                    dbAppointments.forEach((appointment) => {
                        appointment.doctorMessage = null;
                    });
                } else {
                    dbAppointments.forEach((appointment) => {
                        appointment.patientMessage = null;
                    });
                }
        
                await repo.save(dbAppointments);
        
                return {
                    success: true,
                    message: `Message deleted from ${dbAppointments.length} appointments.`,
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: "Unable to save message in appointments: " + error
                } as MutationResponse;
            }
        },
        deleteAppointmentFromAi: async (parent: null, args: any, context: AppContext) => {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({ id: context.me.userId });
            const repo = context.dataSource.getRepository(Appointment);
            const start:string = args.appointmentStart;
        
            if (!dbMe || dbMe.userRoleId !== 3) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse;
            }
        
            const dbAppointment = await repo.findOneBy({ start: new Date(start) });
        
            if (!dbAppointment) {
                return {
                    success: false,
                    message: "Appointment not found"
                } as MutationResponse;
            }
        
            try {
                await repo.delete({ id: dbAppointment.id });
                context.io.emit('refreshEvent', true);
                context.io.emit('refreshEvent', false);
        
                return {
                    success: true,
                    message: "Appointment cancelled",
                    data: {
                        start: dbAppointment.start
                    }
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: "Error while deleting appointment: " + error
                } as MutationResponse;
            }
        }    
    }
}