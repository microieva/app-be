import { User } from "./user.model";
import { AppContext, MutationResponse } from "../types";
import { UserInput } from "./user.input";
//import { DateTime } from "luxon";
import { OAuth2Client } from 'google-auth-library';
import jwt from "jsonwebtoken";

export const userMutationResolver = {
    Mutation: {
        saveDefaultUser: async(parent: null, args: any, context: AppContext)=> {
            const input: UserInput = args.userInput;            
            const repo = context.dataSource.getRepository(User);

            try {
                const newUser = new User();
                if (input.id) {
                    const dbUser = await repo.findOneBy({id: input.id});
                    if (dbUser) {
                        dbUser.firstName = input.firstName && input.firstName !== "" ? input.firstName : dbUser.firstName;
                        dbUser.lastName = input.lastName && input.lastName !== "" ? input.lastName : dbUser.lastName;
                        dbUser.userRoleId = !input.userRoleId ? dbUser.userRoleId : input.userRoleId;
                        dbUser.phone = !input.phone ? dbUser.phone : input.phone;
                        dbUser.email = !input.email ? dbUser.email : input.email;
                        dbUser.password = !input.password ? dbUser.password : input.password;
                        dbUser.dob = input.dob ? new Date(input.dob) : dbUser.dob;
                        dbUser.streetAddress = !input.streetAddress ? dbUser.streetAddress : input.streetAddress;
                        dbUser.city = !input.city ? dbUser.city : input.city;
                        dbUser.postCode = !input.postCode ? dbUser.postCode : input.postCode;
                        dbUser.lastLogInAt = input.lastLogInAt ? new Date(input.lastLogInAt) : dbUser.lastLogInAt;
                        await repo.save(dbUser);
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
                    message: "User saved"
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: `Error while saving user details: ${error}`
                } as MutationResponse;
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
        },
        loginWithGoogle: async (parent: null, args: any, context: AppContext) => {
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const credential = args.googleCredential;

            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new Error('Google token verification failed');
            }

            const repo = context.dataSource.getRepository(User);
            const dbUser = await repo.findOneBy({email: payload.email});

            if (!dbUser) {
                const newUser = new User();
                newUser.email = payload.email;
                newUser.firstName = payload.given_name;
                newUser.lastName = payload.family_name;
                newUser.userRoleId = 2;
                newUser.password = "";

                try {
                    const newDbUser = await repo.save(newUser);
                    return jwt.sign({ userId: newDbUser.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
                } catch (error) {
                    throw new Error(`error saving new user: ${error}`);
                }
            } else {
                return jwt.sign({ userId: dbUser.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
            }
        }
    }
}