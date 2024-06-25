//import { dataSource } from "../../configurations/db.config";
import { User } from "./user.model";
import { AppContext, MutationResponse } from "../types";
import { UserInput } from "./user.input";
//import { DateTime } from "luxon";

export const userMutationResolver = {
    Mutation: {
        saveDefaultUser: async(parent: null, args: any, context: AppContext)=> {
            const input: UserInput = args.userInput;
            
            const repo = context.dataSource.getRepository(User);
            
            if (input) {
                try {
                    const newUser = new User();
                    if (input.id) {
                        const dbUser = await repo.findOneBy({id: input.id});
                        if (dbUser) {
                            dbUser.firstName = !dbUser.firstName ? input.firstName : dbUser.firstName;
                            dbUser.lastName = !dbUser.lastName ? input.lastName : dbUser.lastName;
                            dbUser.userRoleId = !dbUser.userRoleId ? input.userRoleId : dbUser.userRoleId;
                            dbUser.phone = !dbUser.phone ? input.phone : dbUser.phone;
                            dbUser.email = !dbUser.email ? input.email : dbUser.email;
                            dbUser.password = !dbUser.password ? input.password : dbUser.password;
                            dbUser.dob = !dbUser.dob ? new Date(input.dob) : dbUser.dob;
                            dbUser.streetAddress = !dbUser.streetAddress ? input.streetAddress : dbUser.streetAddress;
                            dbUser.city = !dbUser.city ? input.city : dbUser.city;
                            dbUser.postCode = !dbUser.postCode ? input.postCode : dbUser.postCode;
                            dbUser.lastLogInAt = !dbUser.lastLogInAt ? new Date(input.lastLogInAt) : dbUser.lastLogInAt;
                            repo.save({id: input.id, ...dbUser})
                        }
                    }

                    newUser.firstName = input.firstName;
                    newUser.lastName = input.lastName;
                    newUser.userRoleId = input.userRoleId;
                    newUser.phone = input.phone;
                    newUser.email = input.email;
                    newUser.password = input?.password;
                    newUser.dob =new Date(input.dob);
                    newUser.streetAddress = input?.streetAddress;
                    newUser.city = input?.city;
                    newUser.postCode = input?.postCode;
                    newUser.lastLogInAt = input.lastLogInAt ? new Date(input.lastLogInAt) : null;
                    await repo.save(newUser);

                    return {
                        success: true,
                        message: "user saved"
                    } as MutationResponse;
                } catch (error) {
                    return {
                        success: false,
                        message: `Error while saving user details: ${error}`
                    } as MutationResponse;
                }
            } else {
                return {
                    success: false,
                    message: "Required fields incomplete"
                }
            }
        },
        deleteUser: async (parent: null, args: any, context: AppContext)=> {
            const userId: number = args.userId;   
            const repo = context.dataSource.getRepository(User);
            const dbUser = await repo.findOneOrFail({ where: { id: userId } });

            if (dbUser) {
                try {
                    await repo.delete({id: dbUser.id});
                    return {
                        success: true,
                        message: `User deleted successfuly`
                    }
                }catch (error) {
                    return {
                        success: false,
                        message: `Unexpected error on deleting user: ${error}`
                    }
                }

            } else {
                return {
                    success: false,
                    message: "User not found"
                }
            }
        }
    }
}