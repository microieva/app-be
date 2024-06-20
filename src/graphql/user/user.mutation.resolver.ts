import { dataSource } from "../../configurations/db.config";
import { AppContext, MutationResponse } from "../types";
import { User } from "./user.model";

export const userMutationResolver = {
    Mutation: {
        saveDefaultUser: async(parent: null, args: any, context: AppContext)=> {
            const input = args.userInput;
            
            const repo = dataSource
                .createQueryRunner().connection
                .getRepository(User);
            
            if (input.firstName && input.lastName && input.email && input.phone && input.dob) {
                try {
                    const newUser = new User();

                    newUser.firstName = input.firstName;
                    newUser.lastName = input.lastName;
                    newUser.userRoleId = input.userRoleId;
                    newUser.phone = input.phone;
                    newUser.email = input.email;
                    newUser.password = input?.password;
                    newUser.dob = input.dob; // fromISO 
                    newUser.streetAddress = input?.streetAddress;
                    newUser.city = input?.city;
                    newUser.postCode = input?.postCode;

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

        }
    }
}