import { Record } from "../record/record.model";
import { AppContext } from "../types";
import { User } from "../user/user.model";
import { Appointment } from "./appointment.model";

export const appointmentResolver = {
    Appointment: {
        patient: async (parent: Appointment, args: any, context: AppContext)=> {
            try {
                if (parent.patientId) {
                    return await context.dataSource.getRepository(User)
                        .findOneBy({id: parent.patientId})
                } else {
                    return null;
                }
            } catch (error) {
                throw new Error(`Unexpected error while fetching appointment patient: ${error}`)
            }
        },
        doctor: async (parent: Appointment, args: any, context: AppContext)=> {
            try {
                if (parent.doctorId) {
                    return await context.dataSource.getRepository(User)
                        .findOneBy({id: parent.doctorId})
                } else {
                    return null;
                }
            } catch (error) {
                throw new Error(`Unexpected error while fetching appointment patient: ${error}`)
            }
        },
        record: async (parent: Appointment, args: any, context: AppContext) => {
            try {
                return await context.dataSource.getRepository(Record)
                    .findOneBy({appointmentId: parent.id})
            } catch (error) {
                throw new Error(`Unexpected error while fetching appointment patient: ${error}`)
            }
        }
    }
}