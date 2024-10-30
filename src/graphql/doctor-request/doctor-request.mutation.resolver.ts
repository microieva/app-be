import { User } from "../user/user.model";
import { DoctorRequest } from "./doctor-request.model";
import { AppContext } from "../types";

export const doctorRequestMutationResolver = {
    Mutation: {
        deleteDoctorRequest: async (parent: null, args: any, context: AppContext)=> {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(DoctorRequest);
            
            if (!me || me.userRoleId !== 1) {
                return {
                    success: false,
                    message: "Unauthorized action"
                }
            }
            try {
                await repo.delete({id: args.doctorRequestId});
                return {
                    success: true,
                    message: "Doctor request deleted"
                }
            } catch (error) {
                return {
                    success: false,
                    message: "Request cannot be deleted: "+error
                }
            }
        }
    }
}