//import { DateTime } from "luxon";
import { DateTime } from "luxon";
import { AppContext, MutationResponse } from "../types"
import { User } from "../user/user.model";
import { AppointmentInput } from "./appointment.input";
import { Appointment } from "./appointment.model";
import { Not, IsNull } from "typeorm";

export const appointmentMutationResolver = {
    Mutation: {
        saveAppointment: async (parent: null, args: any, context: AppContext) => {
            const input: AppointmentInput = args.appointmentInput;
            const dbMe = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});

            if (!dbMe || (dbMe && dbMe.userRoleId === 1)) {
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
                })
                //{updatedAt: Not(IsNull())});

            if (dbMe.userRoleId === 3) {
                queryBuilder
                    .andWhere('appointment.patientId = :patientId', { patientId: context.me.userId })
            } else if (dbMe.userRoleId === 2) {
                queryBuilder
                    .andWhere('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
                    //.andWhere('appointment.updatedAt = :updatedAt', {updatedAt: true})
            }

            const isReserved = await queryBuilder
                .andWhere({updatedAt: Not(IsNull())})
                .getExists();

            console.log('IS RESERVED:  ', isReserved)

            if (input.id) {
                const dbAppointment = await repo.findOneBy({id: input.id});
                dbAppointment.id = input.id;
                dbAppointment.patientId;
                dbAppointment.doctorId = dbMe.id;
                dbAppointment.start = new Date(input.start);
                dbAppointment.end = new Date(input.end);
                dbAppointment.allDay;

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
                if (isReserved) {
                    return {
                        success: false,
                        message: 'Time overlap!'
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
                } else {
                    newAppointment.doctorId = dbMe.id;
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
        // to avoid creating if conditions to check user role in saveAppointment mutation, we can create saving action for doctors as a seperate mutation name
        
        //saveAllDayEvent: ()=> { FOR DOCTORS TO MARK ALL DAY }
        deleteAppointment: async (parent: null, args: any, context: AppContext) => {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            
            if (!dbMe || dbMe.userRoleId === 1) {
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
        }
    }
}