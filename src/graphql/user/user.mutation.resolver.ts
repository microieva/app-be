import 'dotenv/config'; 
import { DateTime } from "luxon";
import { In } from "typeorm";
import { OAuth2Client } from 'google-auth-library';
import jwt from "jsonwebtoken";
import jose from "node-jose";
import { User } from "./user.model";
import { Appointment } from "../appointment/appointment.model";
import { DoctorRequest } from "../doctor-request/doctor-request.model";
import { Record } from "../record/record.model";
import { UserInput } from "./user.input";
import { AppContext, LoginResponse, MutationResponse } from "../types";
import { getNow } from '../utils';

export const userMutationResolver = {
    Mutation: {
        logOut: async(parent: null, args: any, context: AppContext)=> {
            const repo = context.dataSource.getRepository(User);
            const me = await repo.findOneBy({id: context.me.userId});
            const now = getNow();

            me.lastLogOutAt = now;
            try {
                await repo.save(me);
            } catch (error) {
                console.error('Log out error: ', error)
            }

        },
        saveDoctor: async(parent: null, args: any, context: AppContext)=> {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const requestRepo = context.dataSource.getRepository(DoctorRequest);
            const userRepo = context.dataSource.getRepository(User);
            const dbDoctorRequest = await requestRepo.findOneBy({id: args.doctorRequestId});

            if (!me && me.userRoleId !== 1) {
                return {
                    success: false,
                    message: "Unauthorized action"
                }
            }
            if (!dbDoctorRequest) {
                return {
                    success: false,
                    message: "Doctor request id not found"
                }
            }
            const newUser = new User();

            newUser.email = dbDoctorRequest.email;
            newUser.firstName = dbDoctorRequest.firstName;
            newUser.lastName = dbDoctorRequest.lastName;
            newUser.password = "";
            newUser.userRoleId = dbDoctorRequest.userRoleId;
            newUser.updatedAt = null;

            try {
                await userRepo.save(newUser);
                await requestRepo.delete({id: dbDoctorRequest.id});
                //TO DO sendEmailNotification(); send to the new doctor that account is ready

                return {
                    success: true,
                    message: "User details moved to user table"
                }
            } catch (error) {
                return {
                    success: false,
                    message: "Cannot move user details: "+error
                }
            }
        },
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
            const userId: number | null = args.userId;  
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});

            if (!me) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse;
            }

            const repo = context.dataSource.getRepository(User);
            const appointmentsRepo = context.dataSource.getRepository(Appointment);
            const recordsRepo = context.dataSource.getRepository(Record);

            const dbUserAppointments = await appointmentsRepo
                .createQueryBuilder("appointment")
                .where('appointment.patientId = :patientId', {patientId: userId})
                .orWhere('appointment.doctorId = :doctorId',{doctorId: userId})
                .getMany();

            const ids = dbUserAppointments.map(appointment => appointment.id);

            if (ids.length> 0) {
                try {
                    await recordsRepo.delete({appointmentId: In(ids)});
                } catch (error) {
                    return {
                        success: false,
                        message: "Error deleting user records: "+error
                    } as MutationResponse;
                }
                try {
                    await appointmentsRepo.delete({id: In(ids)});
                } catch (error) {
                    return {
                        success: false,
                        message: "Error deleting user appointments: "+error
                    } as MutationResponse;
                }    
            } 

            try {
                await repo.delete({id: userId});
                return {
                    success: true,
                    message: "User data removed"
                } as MutationResponse;

            } catch (error) {
                return {
                    success: false,
                    message: "Error deleting user account: "+error
                } as MutationResponse;
            }
        },
        login: async (parent: null, args: any, context: AppContext) => {
            const input = args.directLoginInput;
            const dbUser = await context.dataSource.getRepository(User).findOneBy({ email: input.email});
            const repo = context.dataSource.getRepository(User);

            if (!dbUser) throw new Error(`Incorrect email`);

            const isValid = await dbUser.validatePassword(input.password);
            if (!isValid) throw new Error('Invalid password');

            let expiresIn = '10h'; 
            if (dbUser.userRoleId === 3) {
                expiresIn = '1h';
            }

            const token = jwt.sign({ userId: dbUser.id }, process.env.JWT_SECRET, { expiresIn });
            const currentTime = DateTime.now();
            const lastLogin = currentTime.toISO({ includeOffset: true });

            dbUser.lastLogInAt = new Date(lastLogin);

            try {
                await repo.save(dbUser, {listeners: false});
                let expirationTime;
    
                if (expiresIn === '1h') {
                    expirationTime = currentTime.plus({ hours: 1 });
                } else if (expiresIn === '10h') {
                    expirationTime = currentTime.plus({ hours: 10 });
                }
    
                const expirationTimeInFinnishTime = expirationTime.setZone('Europe/Helsinki').toISO();
    
                return {
                    token: token,
                    expiresAt: expirationTimeInFinnishTime
                } as LoginResponse;

            } catch (error) {
                throw new Error('Cannot login, '+error)
            }

        },
        loginWithGoogle: async (parent: null, args: any, context: AppContext) => {
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const credential = args.googleCredential;
            const adminId: number = context.dataSource.getRepository(User).findOneBy({userRoleId: 1}).id

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

            if (dbUser) {
                const token = jwt.sign({ userId: dbUser.id }, process.env.JWT_SECRET!, { expiresIn: '10h' });
                const currentTime = DateTime.now();
                const expirationTime = currentTime.plus({ hours: 10 });
                const expirationTimeInFinnishTime = expirationTime.setZone('Europe/Helsinki').toISO();
                const lastLogin = currentTime.toISO({ includeOffset: true });

                dbUser.lastLogInAt = new Date(lastLogin);
                await repo.save(dbUser);

                return {
                    token: token, 
                    expiresAt: expirationTimeInFinnishTime
                } as LoginResponse;
            } else {
                if (dbRequest) {
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
                        
                        context.io.emit('receiveNotification', {
                            receiverId: adminId,
                            message: 'New doctor account activation request',
                            doctorRequestId: newDoctorRequest.id
                        });
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
        loginWithSignicat: async (parent: null, args: any, context: AppContext)=> {
            const repo = context.dataSource.getRepository(User);

            const jweToken = args.signicatAccessToken;

            try {
                const key = await jose.JWK.asKey(JSON.parse(process.env.SIGNICAT_KEY), 'pem'); //creates a JWK from the private key
                const decryptedToken = await jose.JWE.createDecrypt(key).decrypt(jweToken);
                
                const decryptedPlaintext = JSON.parse(JSON.stringify(decryptedToken.plaintext));

                const buffer = Buffer.from(decryptedPlaintext.data);
                const plaintextString = buffer.toString('utf-8'); 

                const parts = plaintextString.split('.');
                if (parts.length !== 3) {
                    throw new Error('Invalid JWT format');
                }
                    
                const payload = parts[1];
                    
                const decodedPayload = Buffer.from(payload, 'base64url').toString('utf-8');
                const userDetails = JSON.parse(decodedPayload);

                if (userDetails) {
                    const expires_at = userDetails.exp * 1000; 
                    const auth_time = userDetails.auth_time * 1000;
                    const authDateTime = DateTime.fromMillis(auth_time);

                    try {
                        const dbUser = await repo
                            .createQueryBuilder('user')
                            .where({
                                firstName: userDetails.given_name,
                                lastName: userDetails.family_name,
                                dob: userDetails.birthdate
                            })
                            .getOne();

                        if (dbUser) {
                            const token = jwt.sign({ userId: dbUser.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
                            
                            const expirationTime = DateTime.fromMillis(expires_at);
                            const expirationTimeInFinnishTime = expirationTime.setZone('Europe/Helsinki').toISO();
                            const lastLogin = authDateTime.toISO({ includeOffset: true });
            
                            dbUser.lastLogInAt = new Date(lastLogin);
                            await repo.save(dbUser);
            
                            return {
                                token: token, 
                                expiresAt: expirationTimeInFinnishTime
                            } as LoginResponse;
                        } else {
                            const newUser = new User();
    
                            newUser.firstName = userDetails.given_name;
                            newUser.lastName = userDetails.family_name;
                            newUser.dob = new Date(userDetails.birthdate);
                            newUser.userRoleId = 3;
                            newUser.updatedAt = null;
                            newUser.email = "";

                            const user = await repo.save(newUser);

                            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
                            const expirationTime = DateTime.fromMillis(expires_at);
                            const expirationTimeInFinnishTime = expirationTime.setZone('Europe/Helsinki').toISO();
    
                            return {
                                token: token, 
                                expiresAt: expirationTimeInFinnishTime
                            } as LoginResponse;
                        }
                    } catch (error) {
                        throw new Error(error);
                    }
                } else {
                    throw new Error('Bank authentication failed, please try later..')

                }
            } catch (error) {
                throw new Error('Bank authentication failed '+error)
            }
        }
    }
}