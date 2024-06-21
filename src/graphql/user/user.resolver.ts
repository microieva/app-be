import { User } from "./user.model";
import { UserRole } from "./user-role.model";
import { AppContext } from "../types";

export const userResolver = {
    User: {
        userRole: async (parent: User, args: any, context: AppContext)=> {
            const id = parent.userRoleId;
            try {
                return await context.dataSource
                    .getRepository(UserRole)
                    .findOne({
                        where: {
                            id: id
                        },
                        relations: ['users'],
                    })
                    .then(role => role.userRole);
            } catch (error) {
                return {
                    success: false,
                    message: `Cannot find userRole: ${error}`
                }
            }
        }
    }
}