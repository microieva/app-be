import { Record } from "../record/record.model";
import { Appointment } from "../appointment/appointment.model";
import { AppContext } from "../types";

export const recordResolver = {
    Record: {
        appointment: async (parent: Record, args: any, context: AppContext)=> {
            const repo = context.dataSource.getRepository(Appointment);
            try {
                return repo
                    .createQueryBuilder('appointment')
                    .leftJoinAndSelect('appointment.patient', 'patient')
                    .where({id: parent.appointmentId})
                    .getOne();
                    
            } catch (error) {
                throw new Error(`Unexpected error while fetching record appointment: ${error}`)
            }
        }
    }
}
         