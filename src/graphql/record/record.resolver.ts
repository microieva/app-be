import { Record } from "../record/record.model";
import { Appointment } from "../appointment/appointment.model";
import { AppContext } from "../types";

export const recordResolver = {
    Record: {
        appointment: async (parent: Record, args: any, context: AppContext)=> {
            try {
                return await context.dataSource.getRepository(Appointment)
                    .findOneBy({id: parent.appointmentId})
            } catch (error) {
                throw new Error(`Unexpected error while fetching record appointment: ${error}`)
            }
        }
    }
}
         