import { User } from "./user.model";
import { AppContext, LoginResponse, MutationResponse } from "../types";
import { UserInput } from "./user.input";
import { OAuth2Client } from 'google-auth-library';
import jwt from "jsonwebtoken";
import { Appointment } from "../appointment/appointment.model";
import { In } from "typeorm";
import { DateTime } from "luxon";
import { DoctorRequest } from "../doctor-request/doctor-request.model";

export const userMutationResolver = {
    Mutation: {
        saveUser: async(parent: null, args: any, context: AppContext)=> {
            const input: UserInput = args.userInput;            
            const repo = context.dataSource.getRepository(User);

            try {
                const newUser = new User();
                if (input.id) {
                    const dbUser = await repo.findOneBy({id: input.id});
                    if (dbUser) {
                        dbUser.id = input.id;
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

                        return {
                            success: true,
                            message: "User saved"
                        } as MutationResponse;
                    }
                }

                newUser.firstName = input.firstName;
                newUser.lastName = input.lastName;
                newUser.userRoleId = input.userRoleId;
                newUser.phone = input.phone;
                newUser.email = input.email;
                newUser.password = input.password;
                newUser.dob = new Date(input?.dob) || null;
                newUser.streetAddress = input?.streetAddress;
                newUser.city = input?.city;
                newUser.postCode = input?.postCode;
                newUser.lastLogInAt = input.lastLogInAt ? new Date(input.lastLogInAt) : null;
                newUser.updatedAt = null;
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

            if (userId !== context.me.userId) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse;
            }
            const repo = context.dataSource.getRepository(User);
            const appointmentsRepo = context.dataSource.getRepository(Appointment);
            const dbUser = await repo.findOneOrFail({ where: { id: userId } });

            if (dbUser) {
                const dbUserAppointments = await appointmentsRepo
                    .createQueryBuilder("appointment")
                    .where({patientId: userId})
                    .orWhere({doctorId: userId})
                    .getMany();
                try {
                    await repo.delete({id: dbUser.id});
                    await appointmentsRepo.delete({id: In(dbUserAppointments)})
                    // will have to add the same for medical records
                    return {
                        success: true,
                        message: `User deleted successfuly`
                    } as MutationResponse;
                }catch (error) {
                    return {
                        success: false,
                        message: `Unexpected error on deleting user: ${error}`
                    } as MutationResponse;
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
            const requestRepo = context.dataSource.getRepository(DoctorRequest);
            const dbUser = await repo.findOneBy({email: payload.email});
            const dbRequest = await requestRepo.findOneBy({email: payload.email});
            console.log('BD USER: ', dbUser, 'dbRequest: ', dbRequest, 'requestRepo: ', requestRepo)

            if (dbUser) {
                const token = jwt.sign({ userId: dbUser.id }, process.env.JWT_SECRET!, { expiresIn: '10h' });
                const currentTime = DateTime.now();
                const expirationTime = currentTime.plus({ hours: 10 });
                const expirationTimeInFinnishTime = expirationTime.setZone('Europe/Helsinki').toISO();
                
                return {
                    token: token, 
                    expiresAt: expirationTimeInFinnishTime
                } as LoginResponse;
            } else {
                if (dbRequest) {
                    console.log('ONLY REQUEST: ', dbRequest)
                    throw new Error(`This account request is in process. Please try later`);
                } else {
                    const newRequest = new DoctorRequest();
                    newRequest.email = payload.email;
                    newRequest.firstName = payload.given_name;
                    newRequest.lastName = payload.family_name;
                    newRequest.userRoleId = 2;
                    newRequest.updatedAt = null;
    
                    try {
                        const newDoctorRequest = await requestRepo.save(newRequest);
                        const token = jwt.sign({ userId: newDoctorRequest.id }, process.env.JWT_SECRET!, { expiresIn: '10h' });
                        const currentTime = DateTime.now();
                        const expirationTime = currentTime.plus({ hours: 10 });
                        const expirationTimeInFinnishTime = expirationTime.setZone('Europe/Helsinki').toISO();
    
                        return {
                            token: token, 
                            expiresAt: expirationTimeInFinnishTime
                        } as LoginResponse;
                    } catch (error) {
                        throw new Error(`error saving new request: ${error}`);
                    }
                }
            }
        },
        loginWithSignicat: (parent: null, args: any, context: AppContext)=> {
            const accessToken = args.signicatAccessToken;
            console.log('SIGNICAT TOKEN ??? ', accessToken);
            try {
                const decodedToken = jwt.verify(accessToken, process.env.SIGNICAT_PUBLIC_KEY);
                // Now you can access the payload from `decodedToken`
                console.log("DECODED TOKEN: ", decodedToken);
                // Handle the payload as needed (e.g., extract user information)
            } catch (error) {
                console.error('Error decoding token:', error.message);
                // Handle the error (e.g., invalid token)
            }

        }
    }
}