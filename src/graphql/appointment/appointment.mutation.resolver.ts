import { AppContext, MutationResponse } from "../types"
import { User } from "../user/user.model";
import { AppointmentInput } from "./appointment.input";
import { Appointment } from "./appointment.model";

export const appointmentMutationResolver = {
    Mutation: {
        saveAppointment: async (parent: null, args: any, context: AppContext) => {
            const input: AppointmentInput = args.appointmentInput;
            console.log('INPUT from saveAppointment: ', input);
            const dbMe = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId})

            if (dbMe && dbMe.userRoleId !== 3) {
                return {
                    success: false,
                    message: 'Unauthorized action'
                } as MutationResponse;
            }

            const repo = context.dataSource.getRepository(Appointment);
            try {
                if (input.id) {
                    const dbAppointment = await repo.findOneBy({id: input.id});
                    if (dbAppointment) {
                        dbAppointment.id = input.id;
                        dbAppointment.patientId;
                        dbAppointment.doctorId = dbMe.id;
                        dbAppointment.start = new Date(input.start);
                        dbAppointment.end = new Date(input.end);
                        dbAppointment.allDay;

                        await repo.save(dbAppointment);
                        return {
                            success: true,
                            message: "Appointment updated"
                        } as MutationResponse;
                    }
                }
                const newAppointment = new Appointment();

                newAppointment.patientId = dbMe.id;
                newAppointment.updatedAt = null;
                newAppointment.doctorId;
                newAppointment.start = new Date(input.start);
                newAppointment.end = new Date(input.end);
                newAppointment.allDay = false;

                await repo.save(newAppointment);
                return {
                    success: true,
                    message: 'Appointment saved'
                } as MutationResponse;

            } catch (error){
                return {
                    success: false,
                    message: `Appointment could not be created: ${error}`
                } as MutationResponse;
            }
        },
        // to avoid creating if conditions to check user role in saveAppointment mutation, we can create saving action for doctors as a seperate mutation name
        
        //saveAllDayEvent: ()=> { FOR DOCTORS TO MARK ALL DAY }
    }
}