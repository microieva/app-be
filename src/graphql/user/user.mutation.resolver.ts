import 'dotenv/config'; 
import { DateTime } from "luxon";
import { In, Repository } from "typeorm";
import { OAuth2Client } from 'google-auth-library';
import jwt from "jsonwebtoken";
import jose from "node-jose";
import { sendEmailNotification } from "../../services/email.service";
import { User } from "./user.model";
import { Appointment } from "../appointment/appointment.model";
import { DoctorRequest } from "../doctor-request/doctor-request.model";
import { Record } from "../record/record.model";
import { Chat } from '../chat/chat.model';
import { UserInput } from "./user.input";
import { AppContext, LoginResponse, MutationResponse } from "../types";
import { getNow } from '../utils';
import {DOCTOR_REQUEST_CREATED, ACCOUNT_ACTIVATED, USER_UPDATED} from "../constants";


export const userMutationResolver = {
    Mutation: {
        logOut: async(parent: null, args: any, context: AppContext)=> {
            const repo = context.dataSource.getRepository(User);
            const me = await repo.findOneBy({id: context.me.userId});
            const now = new Date();

            try {
                await repo.update(me.id, {lastLogOutAt:now});
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
                const savedUser = await userRepo.save(newUser);
                await requestRepo.delete({id: dbDoctorRequest.id});
                sendEmailNotification(savedUser, ACCOUNT_ACTIVATED)

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
            const repo: Repository<User> = context.dataSource.getRepository(User);
            const isUser = await repo.findOneBy({email: input.email});

            if (isUser && !input.id) {
                return {
                    success: false,
                    message: "This email address is already in use"
                } as MutationResponse;
            }
            let dbUser:User;
            if (input.id) {
                dbUser = await repo.findOneBy({id: input.id});
            } else {
                dbUser = await repo.findOneBy({id: context.me.userId});
            }

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
                dbUser.updatedAt = new Date();
                
                let isFirstUpdate:boolean = false;
                if (!dbUser.updatedAt) isFirstUpdate = true;
                
                try {
                    await repo.save(dbUser);

                    if (isFirstUpdate) {
                        const rooms = context.io.sockets.adapter.rooms;
                            Array.from(rooms.keys()).some(roomName => {
                            const room = roomName.endsWith(`_${dbUser.id}`)
                            if (room) {
                                context.io.to(roomName).emit(USER_UPDATED)
                            }
                        });    
                    }
                
                    return {
                        success: true,
                        message: "User updated"
                    } as MutationResponse;
                } catch (error) {
                    return {
                        success: false,
                        message: "Unexpected error updating user details: "+error
                    } as MutationResponse;
                }
            } else {
                return {
                        success: false,
                        message: "User you are trying to modify does not exist"
                    } as MutationResponse;
            }
        },
        createUser: async (parent:null, args:any, context:AppContext) => {
            const input: UserInput = args.userInput; 
            const repo: Repository<User> = context.dataSource.getRepository(User);
            const me = await repo.findOneBy({id:context.me.userId});

            if (me.userRoleId !== 1) {
                return {
                    success: false,
                    message: "Unauthorized action"
                } as MutationResponse
            }

            if (await repo.findOneBy({email: input.email})) {
                 return {
                    success: false,
                    message: "Email already in use"
                } as MutationResponse
            }

            const newUser = new User();
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

            try {
                // TO DO: find out if create will use pasw hashing now
                const user = repo.create(newUser);
                const data =await repo.save(user);

                return {
                    success: true,
                    message: "User created",
                    createdAt: data.createdAt
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: `Error while creating user: ${error}`
                } as MutationResponse;
            }
        },
        deleteUser: async (parent: null, args: any, context: AppContext)=> {
            //const userId: number | undefined = args.userId;  
            const userId = args.userId || context.me.userId;
            //const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const dbUserToDelete = await context.dataSource.getRepository(User).findOneBy({id: userId});

            // if (!me || (me.userRoleId !== 1 && args.userId)) {
            //     return {
            //         success: false,
            //         message: "Forbidden action"
            //     } as MutationResponse;
            // }


            const userRepo = context.dataSource.getRepository(User);
            const appointmentsRepo = context.dataSource.getRepository(Appointment);
            const recordsRepo = context.dataSource.getRepository(Record);
            const chatRepo = context.dataSource.getRepository(Chat);

            const dbUserAppointments = await appointmentsRepo
                .createQueryBuilder("appointment")
                .select("appointment.id", "id")
                .where('appointment.patientId = :userId', { userId })
                .orWhere('appointment.doctorId = :userId', { userId })
                .getRawMany();
            
            const dbUserAppointmentIds: number[] = dbUserAppointments.map(item => item.id);

            const recordQueryBuilder = recordsRepo
                .createQueryBuilder("record")
                .where('record.patientId = :patientId', {patientId: userId})
                .orWhere('record.doctorId = :doctorId',{doctorId: userId})

            await recordsRepo
                .createQueryBuilder()
                .delete()
                .from(Record)
                .where({doctorId:userId})
                .andWhere({draft:true})
                .execute();

            if (dbUserAppointmentIds.length> 0) {
                try {
                    await appointmentsRepo.delete({id: In(dbUserAppointmentIds)});
                } catch (error) {
                    return {
                        success: false,
                        message: "Error deleting user appointments: "+error
                    } as MutationResponse;
                }
            } 
            const dbUserRecords = await recordQueryBuilder.select('record.id', 'id').getRawMany();
            const dbUserRecordIds: number[] = dbUserRecords.map(item => item.id);
            if (dbUserRecordIds.length>0) {
                try {
                    if (dbUserToDelete.userRoleId === 3) {
                        await recordsRepo.delete({id: In(dbUserRecordIds)});
                    } else if (dbUserToDelete.userRoleId === 2) {
                        await recordQueryBuilder.where({id: In(dbUserRecordIds), draft:false}).update({doctorId:null}).execute();
                        await recordsRepo.delete({id: In(dbUserRecordIds), draft:true})
                    }   
                } catch (error) {
                    return {
                        success: false,
                        message: "Error processing user records: "+error
                    } as MutationResponse;
                }
            }

            const rawResults = await chatRepo
                .createQueryBuilder('chat')
                .leftJoin('chat.participants', 'participants')
                .where('participants.id = :userId', { userId })
                .select('chat.id', 'id')
                .getRawMany();

            const dbUserChatIds: number[] = rawResults.map(item => item.id);

            if (dbUserChatIds.length > 0) {
                try {
                    await chatRepo.delete({id: In(dbUserChatIds)}); 
                } catch (error) {
                    return {
                        success: false,
                        message: "Error deleting user chats: " + error
                    } as MutationResponse;
                }
            }
        
            try {
                await userRepo.delete({id: userId});

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
            const repo = context.dataSource.getRepository(User);
            const user:User = await repo.findOneBy({ email: input.email});

            if (!user) {
                return {
                    __typename: 'LoginFailure',
                    message:"Incorrect email"
                } as LoginResponse;
            }
            const isValidPassword = await user.validatePassword(input.password);

            if (!isValidPassword && user) {
                return {
                    __typename: 'LoginFailure',
                    message:"Incorrect password"
                } as LoginResponse;
            }

            let expiresIn = '10h'; 
            if (user.userRoleId === 3) {
                expiresIn = '1h';
            }
            

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn });
            const currentTime = DateTime.now();
            const lastLogin = currentTime.toISO({ includeOffset: true });

            user.lastLogInAt = new Date(lastLogin);
            user.updatedAt = user.updatedAt;

            try {
                await repo.save(user, {listeners: false});
                let expirationTime;
    
                if (expiresIn === '1h') {
                    expirationTime = currentTime.plus({ hours: 1 });
                } else if (expiresIn === '10h') {
                    expirationTime = currentTime.plus({ hours: 10 });
                }
    
                const expirationTimeInFinnishTime = expirationTime.setZone('Europe/Helsinki').toISO();
    
                return {
                    __typename: 'LoginSuccess',
                    token: token,
                    expiresAt: expirationTimeInFinnishTime
                } as LoginResponse;

            } catch (error) {
                return {
                    __typename: 'LoginFailure',
                    message:error
                } as LoginResponse;
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

            if (dbUser) {
                const token = jwt.sign({ userId: dbUser.id }, process.env.JWT_SECRET!, { expiresIn: '10h' });
                const currentTime = DateTime.now();
                const expirationTime = currentTime.plus({ hours: 10 });
                const expirationTimeInFinnishTime = expirationTime.setZone('Europe/Helsinki').toISO();
                const lastLogin = currentTime.toISO({ includeOffset: true });

                dbUser.lastLogInAt = new Date(lastLogin);
                await repo.save(dbUser);

                return {
                    __typename: 'LoginSuccess',
                    token: token, 
                    expiresAt: expirationTimeInFinnishTime
                } as LoginResponse;
            } else {
                const dbDoctorRequest = await requestRepo.findOneBy({email: payload.email});
                if (dbDoctorRequest) {
                    return {
                        __typename: 'LoginFailure',
                        message: "Pending approval"
                    } as LoginResponse;
                } else {
                    const newRequest = new DoctorRequest();
                    newRequest.email = payload.email;
                    newRequest.firstName = payload.given_name;
                    newRequest.lastName = payload.family_name;
                    newRequest.userRoleId = 2;
                    newRequest.updatedAt = null;
    
                    try {
                        const newDoctorRequest = await requestRepo.save(newRequest);
                        context.io.to('admins').emit(DOCTOR_REQUEST_CREATED, {
                            event: DOCTOR_REQUEST_CREATED,
                            message: "New doctor account activation request",
                            data: newDoctorRequest
                        })
                        sendEmailNotification(newDoctorRequest, DOCTOR_REQUEST_CREATED);

                        return {
                            __typename: 'LoginFailure',
                            message: "Request saved"
                        } as LoginResponse;
                    } catch (error) {
                        throw new Error(`Error saving new request: ${error}`);
                    }
                }
            }
        },
        loginWithSignicat: async (parent: null, args: any, context: AppContext)=> {
            const repo = context.dataSource.getRepository(User);

            const jweToken = args.signicatAccessToken;

            try {
                const key = await jose.JWK.asKey(JSON.parse(process.env.SIGNICAT_KEY), 'pem'); 
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
                    let uniqueEmail: string;    

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
                                __typename: 'LoginSuccess',
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
                            if (userDetails.email) {
                                newUser.email = userDetails.email;
                            } else {
                                uniqueEmail = `${userDetails.given_name.toLowerCase()}.${userDetails.family_name.toLowerCase()}@insertedonbankingsignup${DateTime.now().toISODate()}.com`;
                                newUser.email = uniqueEmail;
                            }

                            const user = await repo.save(newUser);

                            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
                            const expirationTime = DateTime.fromMillis(expires_at);
                            const expirationTimeInFinnishTime = expirationTime.setZone('Europe/Helsinki').toISO();
    
                            return {
                                __typename: 'LoginSuccess',
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
        },
        deactivateDoctorAccountsByIds: async (parent: null, args: any, context: AppContext)=> {
            const doctorIds: number[] = args.userIds;  
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const userRepo = context.dataSource.getRepository(User);
            const requestRepo = context.dataSource.getRepository(DoctorRequest);
            const appointmentRepo = context.dataSource.getRepository(Appointment);
            const recordRepo = context.dataSource.getRepository(Record);
            const chatRepo = context.dataSource.getRepository(Chat);
            const now = getNow();

            if (me.userRoleId !== 1) {
                return {
                    success: false, 
                    message: "Unauthorized action"
                } as MutationResponse;
            }

            const dbDoctors = await userRepo
                .createQueryBuilder('user')
                .where('user.id IN (:...ids)', { ids: doctorIds })
                .andWhere(qb => {
                    const subQuery = qb
                        .subQuery()
                        .select('doctor_request.email')
                        .from(DoctorRequest, 'doctor_request')
                        .getQuery();
                    return 'user.email NOT IN ' + subQuery;
                })
                .getMany();

            const doctorIdsToDeactivate = dbDoctors.map(doctor =>doctor.id);
  
            const dbDoctorsToDeactivate:User[] = await userRepo
                .createQueryBuilder('user')
                .where('user.id IN (:...ids)', {ids:doctorIdsToDeactivate})
                .getMany();

                try {
                    await appointmentRepo
                    .createQueryBuilder()
                    .delete()
                    .from(Appointment)
                    .where("end <= :now", { now })
                    .andWhere({ doctorId: In(doctorIdsToDeactivate) })
                    .execute();


                    await appointmentRepo
                        .createQueryBuilder()
                        .update(Appointment)
                        .set({ doctorId: null, doctorMessage: null })
                        .where("end > :now", { now })
                        .andWhere({ doctorId: In(doctorIdsToDeactivate) })
                        .execute();
                    

                    await recordRepo
                        .createQueryBuilder()
                        .update(Record)
                        .set({ doctorId: null, appointmentId: null })
                        .where({ doctorId: In(doctorIdsToDeactivate) , draft: false })
                        .execute();
                                    
                    await recordRepo
                        .createQueryBuilder()
                        .delete()
                        .from(Record)
                        .where({ doctorId: In(doctorIdsToDeactivate) , draft: true })
                        .execute();

                    const chats = await context.dataSource.getRepository(Chat)
                        .createQueryBuilder('chat')
                        .innerJoin('chat.participants', 'participants')
                        .innerJoin('ChatParticipant', 'cp', 'cp.chatId = chat.id')
                        .where('participants.id IN (:...ids)', { ids: doctorIds })
                        .groupBy('chat.id')
                        .having('COUNT(DISTINCT participants.id) = :doctorCount', { doctorCount: doctorIds.length })
                        .getMany();

                    const dbUserChatIds = chats.map(chat => chat.id);
                    await chatRepo.delete({id: In(dbUserChatIds)});

                    dbDoctorsToDeactivate.forEach(async doctor => {
                        const doctorRequest = new DoctorRequest();
                        doctorRequest.email = doctor.email;
                        doctorRequest.firstName = doctor.firstName;
                        doctorRequest.lastName = doctor.lastName;
                        doctorRequest.userRoleId = 2;
                        doctorRequest.updatedAt = null;
                        
                        try {
                            await requestRepo.save(doctorRequest);
                        } catch (error) {
                            return {
                                success: false, 
                                message: "Unexpected error when moving details to requests: "+error
                            } as MutationResponse;
                        }  
                        try {
                            await userRepo.delete({id:doctor.id});
                        } catch (error) {
                            return {
                                success: false, 
                                message: "Unexpected error when deleting user details: "+error
                            } as MutationResponse;
                        }  
                        return true;
                    });
                    return {
                        success:true,
                        message: "Completed succesfully"
                    } as MutationResponse

                } catch (error) {
                    return {
                        success: false, 
                        message: "Unexpected error when processing deactivation: "+error
                    } as MutationResponse;
                }
        },
        saveDoctorsByIds:async (parent: null, args: any, context: AppContext)=> {
            const doctorRequestIds:number[] = args.userIds;
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const requestRepo = context.dataSource.getRepository(DoctorRequest);
            const userRepo = context.dataSource.getRepository(User);

            if (me.userRoleId !== 1) {
                return {
                    success: false, 
                    message: "Uauthorized action"
                } as MutationResponse; 
            }

            const doctorRequestsForActivation = await requestRepo
                .createQueryBuilder('doctor_request')
                .where('doctor_request.id IN (:...ids)', {ids:doctorRequestIds})
                .getMany();

            try {
                doctorRequestsForActivation.forEach(async userData => {
                    const isActive = await userRepo.findOneBy({email: userData.email});
                    if (!isActive) {
                        const newDoctor = new User();
                        newDoctor.email = userData.email;
                        if (userData.email.endsWith('@email.com')) {
                            newDoctor.password = "demo"
                        }
                        newDoctor.firstName = userData.firstName;
                        newDoctor.lastName = userData.lastName;
                        newDoctor.userRoleId = 2;
                        newDoctor.password = "";
                        newDoctor.updatedAt = null;

                        await userRepo.save(newDoctor);
                        await requestRepo.delete({id: userData.id});
                        sendEmailNotification(newDoctor, ACCOUNT_ACTIVATED)
                    }
                })
                return {
                    success: true, 
                    message: "Accounts activated"
                } as MutationResponse; 
            } catch (error) {
                return {
                    success: false, 
                    message: error
                } as MutationResponse; 
            }
        }
    }
}