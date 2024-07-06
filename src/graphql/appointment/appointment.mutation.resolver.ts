import { AppContext, MutationResponse } from "../types"
import { User } from "../user/user.model";
import { Appointment } from "./appointment.model";

export const appointmentMutationResolver = {
    Mutation: {
        saveAppointment: async (parent: null, args: any, context: AppContext) => {
            const input = args.appointmentInput;
            console.log('input from saveAppointment: ', input);
            if (args.userId !== context.me.userId) {
                return {
                    success: false,
                    message: 'Unauthorized action'
                } as MutationResponse;
            }

            const me = await context.dataSource.getRepository(User).findOneBy({ id: args.userId });

            if (me.userRole.userRole !== 'patient') {
                return {
                    success: false,
                    message: 'Unauthorized action'
                } as MutationResponse;
            }

            const repo = context.dataSource.getRepository(Appointment);
            console.log('repo from saveAppointment: ', repo);
            try {
                //repo.save(apntmt)
                return {
                    success: true,
                    message: 'Appointment created'
                } as MutationResponse;

            } catch (error){
                return {
                    success: false,
                    message: `Appointment could not be created: ${error}`
                } as MutationResponse;
            }
        }
    }
}