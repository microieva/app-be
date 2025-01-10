import { User } from "../user/user.model";
import { DoctorRequest } from "./doctor-request.model";
import { AppContext, MutationResponse } from "../types";
import { In } from "typeorm";

export const doctorRequestMutationResolver = {
    Mutation: {
        deleteDoctorRequestsByIds: async (parent: null, args: any, context: AppContext)=> {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(DoctorRequest);
            
            if (!me && me.userRoleId !== 1) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse
            }
            try {
                await repo.delete({id: In(args.userIds)});
                return {
                    success: true,
                    message: "All details deleted"
                } as MutationResponse
            } catch (error) {
                return {
                    success: false,
                    message: error
                } as MutationResponse
            }
        }
    }
}