import { User } from "./user.model";
import { UserRole } from "./user-role.model";
import { AppContext } from "../types";

export const userResolver = {
    User: {
        userRole: async (parent: User, args: any, context: AppContext)=> {
            const id = parent.userRoleId;
            try {
                const role = await context.dataSource
                    .getRepository(UserRole)
                    .findOne({
                        where: {
                            id: id
                        }
                })
                return role.userRole;
            } catch (error) {
                return {
                    success: false,
                    message: `Cannot find userRole: ${error}`
                }
            }
        },
        /*countAppointments: async (parent: User, args: any, context: AppContext)=> {
            const role = parent.userRole;
            switch (role) {
                case 'admin':
                    throw new Error('Unauthorized action');
                case 'patient':
                    return parent.patientAppointments.length;
                case 'doctor':
                    return parent.doctorAppointments.length;
                default:
                    throw new Error('Unauthorized action');
            }
            
        }*/
    }
}