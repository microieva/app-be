import { DateTime } from "luxon";
import { User } from "./user/user.model";
import { Appointment } from "./appointment/appointment.model";
import { Record } from "./record/record.model";
import { DoctorRequest } from "./doctor-request/doctor-request.model";
import { Chat } from "./chat/chat.model";
import { Message } from "./message/message.model";
import { ChatParticipant } from "./chat-participant/chat-participant.model";
import { AppContext } from "./types";
import { getNow } from "./utils";
import { Feedback } from "./feedback/feedback.model";

export const queries = {
    Query: {
        me: async (parent: null, args: any, context: AppContext)=> {
            const userId = context.me.userId;
            const requestRepo = context.dataSource.getRepository(DoctorRequest);
            const repo = context.dataSource.getRepository(User);

            try {
                const me = await repo.findOne({where: {id: userId}});
                const isRequest = await requestRepo.findOneBy({email: me.email});
    
                if (isRequest) {
                    throw new Error(`This account request is in process. Please try later..`);
                }
                return me;
            } catch (error) {
                return null;
            }
        },
        user: async (parent: null, args: any, context: AppContext)=> {
            const repo = context.dataSource.getRepository(User);
            try {
                return await repo.findOneBy({id: args.userId});
            } catch (error) {
                throw new Error("user not found: "+error);
            }
        },
        request: async (parent: null, args: any, context: AppContext)=> {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(DoctorRequest);

            if (!me || me.userRoleId !== 1) {
                throw new Error("Unauthorized action")
            }
            try {
                return await repo.findOneBy({id: args.userId});
            } catch (error) {
                throw new Error("Doctor account request not found: "+error);
            }
        },
        doctors: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({ id: context.me.userId });
            const repo = context.dataSource.getRepository(User);
            const { pageIndex, pageLimit, sortActive, sortDirection, filterInput } = args;
        
            if (!me || me.userRoleId !== 1) {
                throw new Error("Unauthorized action");
            }
        
            let slice: User[];
            let length: number = 0;
        
            try {
                const queryBuilder = repo
                    .createQueryBuilder('user')
                    .where('user.userRoleId = :userRoleId', { userRoleId: 2 });
        
                if (filterInput) {
                    queryBuilder.andWhere(
                        '(LOWER(user.firstName) LIKE :nameLike OR LOWER(user.lastName) LIKE :nameLike)',
                        { nameLike: `%${filterInput}%` }
                    );
                }
        
                if (sortActive === 'unreadMessages') {
                    queryBuilder
                        .addSelect(subQuery => {
                            return subQuery
                                .select('COUNT(message.id)', 'unreadMessages')
                                .from(Message, 'message')
                                .leftJoin('message.chat', 'chat')
                                .leftJoin('chat.participants', 'participants')
                                .where('message.isRead = :isRead', { isRead: false })
                                .andWhere('participants.id = user.id') 
                                .andWhere('message.senderId != :userId', { userId: context.me.userId });
                        }, 'unreadMessages')
                        .orderBy('unreadMessages', sortDirection as 'ASC' | 'DESC');
                } else {
                    queryBuilder.orderBy(`user.${sortActive}`, `${sortDirection}` as 'ASC' | 'DESC');
                }
        
                const [doctors, count]: [User[], number] = await queryBuilder
                    .limit(pageLimit)
                    .offset(pageIndex * pageLimit)
                    .getManyAndCount();
        
                length = count;
                slice = doctors;
            } catch (error) {
                throw new Error(`Error fetching doctors: ${error}`);
            }
        
            return {
                slice,
                length
            };
        },        
        patients: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(User);
            const { pageIndex, pageLimit, sortActive, sortDirection, filterInput } = args;

            if (!me || me.userRoleId !== 1) {
                throw new Error("Unauthorized action")
            }
            let slice: User[] = [];
            let length: number = 0;

            try {
                const queryBuilder = repo
                    .createQueryBuilder('user')
                    .where('user.userRoleId = :userRoleId', { userRoleId: 3})
                    queryBuilder.andWhere(
                        '(LOWER(user.firstName) LIKE :nameLike OR LOWER(user.lastName) LIKE :nameLike)',
                        { nameLike:  `%${filterInput}%` }
                    );
    
                const [patients, count]: [User[], number] = await queryBuilder
                    .orderBy(`user.${sortActive}` || 'user.createdAt', `${sortDirection}` as 'ASC' | 'DESC')
                    .limit(pageLimit)
                    .offset(pageIndex * pageLimit)
                    .getManyAndCount();

                length = count;
                slice = patients;
            } catch (error) {
                throw new Error(`Error fetching patients: ${error}`);
            }
            return {
                slice,
                length
            }
        },
        requests: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(DoctorRequest);
            const { pageIndex, pageLimit, sortActive, sortDirection, filterInput } = args;

            if (me.userRoleId !== 1) {
                throw new Error("Unauthorized action")
            }

            let slice: DoctorRequest[];
            let length: number = 0;

            try {
                const queryBuilder = repo
                    .createQueryBuilder('doctor_request')
    
                if (filterInput) {
                    queryBuilder.andWhere(
                        '(LOWER(doctor_request.firstName) LIKE :nameLike OR LOWER(doctor_request.lastName) LIKE :nameLike)',
                        { nameLike:  `%${filterInput}%` }
                    );
                }
                const [requests, count]: [DoctorRequest[], number] = await queryBuilder
                    .orderBy(`doctor_request.${sortActive}` || 'doctor_request.createdAt', `${sortDirection}` as 'ASC' | 'DESC')
                    .limit(pageLimit)
                    .offset(pageIndex * pageLimit)
                    .getManyAndCount();

                length = count;
                slice = requests
            } catch (error) {
                throw new Error(`Error fetching doctor account requests: ${error}`);
            }
            return {
                slice,
                length
            }
        },
        allAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = context.dataSource.getRepository(User).findOneBy({id: context.me.userId});

            if (!me) {
                throw new Error("Action unauthorized")
            }
            const repo = context.dataSource.getRepository(Appointment);
            try {
                return repo
                    .createQueryBuilder('appointment')
                    .leftJoinAndSelect('appointment.patient', 'patient')
                    .getMany();
            } catch (error) {
                throw new Error(`Error fetching appointments: ${error}`);
            }
        },
        appointment: async (parent: null, args: any, context: AppContext)=> {
            try {
                return await context.dataSource.getRepository(Appointment)
                    .findOneBy({id: args.appointmentId});
            } catch (error) {
                throw new Error(`Error fetching appointments: ${error}`);
            }
        },
        appointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(Appointment)
            if (!me) {
                throw new Error('Unauthorized action')
            }
            try {
                if (me.userRoleId === 3) {
                    const queryBuilder = repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId = :patientId', {patientId: me.id})

                    return await queryBuilder.getMany();
                } else if (me.userRoleId === 1) {
                    return await repo.find();
                }
                else {
                    const queryBuilder = repo
                        .createQueryBuilder('appointment')
                        .where('appointment.doctorId = :doctorId', {doctorId: me.id})
                        .orWhere('appointment.doctorId IS NULL')

                    return await queryBuilder.getMany();
                }
            } catch (error) {
                throw new Error(`Error fetching appointments: ${error}`);
            }
        },
        nowAppointment: async (parent: null, args: any, context: AppContext)=> {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});

            if (!me || me.userRoleId === 1) {
                throw new Error("Unauthorized action")
            }
            const now = getNow();
            const repo = context.dataSource.getRepository(Appointment);

            try {
                return await repo
                    .createQueryBuilder('appointment')
                    .leftJoinAndSelect('appointment.patient', 'patient')
                    .where('appointment.patientId IS NOT NULL')
                    .andWhere('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
                    .andWhere(':now BETWEEN appointment.start AND appointment.end', { now })
                    .getOne();

            } catch (error) {
                throw new Error("Error fetching now appointment: "+error)
            }
            
        },
        pendingAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const { pageIndex, pageLimit, sortActive, sortDirection, filterInput } = args;
            const now = getNow(); 

            let length: number = 0;
            let slice: Appointment[] = [];   

            if (me) {
                if (me.userRoleId === 3) {
                    try {
                        const [appointments, count]: [Appointment[], number] = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId: context.me.userId })
                            .andWhere('appointment.doctorId IS NULL')
                            .andWhere('appointment.start > :now', {now})
                            .orderBy(`appointment.${sortActive}` || 'appointment.start', `${sortDirection}` as 'ASC' | 'DESC')
                            .limit(pageLimit)
                            .offset(pageIndex * pageLimit)
                            .getManyAndCount()

                        length = count;
                        slice = appointments
                    } catch (error) {
                        throw new Error(`Error fetching pending appointments: ${error}`);
                    }

                } else {
                    try {
                        const reservedTimes = await repo
                            .createQueryBuilder('appointment')
                            .select('appointment.start')
                            .where('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
                            .getRawMany();

                        const formattedReservedTimes: string[] = reservedTimes.map(rt => DateTime.fromJSDate(rt.appointment_start).toISO({ includeOffset: false }));

                        const queryBuilder = repo
                            .createQueryBuilder('appointment')
                            .leftJoinAndSelect('appointment.patient', 'patient')
                            .where('appointment.doctorId IS NULL')
                            .andWhere('appointment.start > :now', {now})
                        
                        if (formattedReservedTimes.length>0) {
                            queryBuilder.andWhere('appointment.start NOT IN (:...reservedTimes)', { reservedTimes: formattedReservedTimes });
                        }

                        if (filterInput) {
                            queryBuilder.andWhere(
                                '(LOWER(patient.firstName) LIKE :nameLike OR LOWER(patient.lastName) LIKE :nameLike)',
                                { nameLike:  `%${filterInput}%` }
                            );
                        }

                        let orderByField: string;
                        if (sortActive === 'firstName') {
                            orderByField = 'patient.firstName';
                        } else {
                            orderByField = `appointment.${sortActive}` || 'appointment.start';
                        }
                        const [appointments, count]: [Appointment[], number] = await queryBuilder
                            .orderBy(orderByField, `${sortDirection}` as 'ASC' | 'DESC')
                            .limit(pageLimit)
                            .offset(pageIndex * pageLimit)
                            .getManyAndCount();


                        length = count;
                        slice = appointments;
                    } catch (error) {
                        throw new Error(`Error fetching pending appointments: ${error}`);
                    }
                }
            } else {
                throw new Error('Authenticate yourself')
            }

            return {
                length,
                slice
            }
        },
        upcomingAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const { pageIndex, pageLimit, sortActive, sortDirection, filterInput } = args;

            let length: number = 0;
            let slice: Appointment[] = [];   
            const now = getNow();

            if (me) {
                if (me.userRoleId === 3) {
                    try {
                        const queryBuilder = repo.createQueryBuilder('appointment')
                            .leftJoinAndSelect('appointment.doctor', 'doctor')
                            .leftJoinAndSelect('appointment.record', 'record')
                            .where('appointment.patientId = :patientId', {patientId: context.me.userId })
                            .andWhere('appointment.doctorId IS NOT NULL') 
                            .andWhere('appointment.start > :now', { now })
            
                        if (filterInput) {
                            queryBuilder.andWhere(
                                '(LOWER(doctor.firstName) LIKE :nameLike OR LOWER(doctor.lastName) LIKE :nameLike)',
                                { nameLike:  `%${filterInput}%` }
                            );
                        }

                        let orderByField: string;
                        if (sortActive === 'firstName') {
                            orderByField = 'doctor.firstName';
                        } else if (sortActive === 'record'){
                            orderByField = `CASE WHEN appointment.record IS NULL THEN 0 WHEN record.draft = 'FALSE' THEN 1 ELSE 0 END`
                        } else {
                            orderByField = `appointment.${sortActive}` || 'appointment.start';
                        }
                        const [appointments, count]: [Appointment[], number] = await queryBuilder
                            .orderBy(orderByField, `${sortDirection}` as 'ASC' | 'DESC')
                            .limit(pageLimit)
                            .offset(pageIndex * pageLimit)
                            .getManyAndCount();

                        length = count;
                        slice = appointments
                    } catch (error) {
                        throw new Error(`Error fetching upcoming appointments: ${error}`);
                    }

                } else {
                    try {
                        const queryBuilder = repo.createQueryBuilder('appointment')
                            .leftJoinAndSelect('appointment.patient', 'patient')
                            .leftJoinAndSelect('appointment.record', 'record')
                            .where('appointment.doctorId = :doctorId', {doctorId: context.me.userId })
                            .andWhere('appointment.patientId IS NOT NULL') 
                            .andWhere('appointment.start > :now', { now })
            
                        if (filterInput) {
                            queryBuilder.andWhere(
                                '(LOWER(patient.firstName) LIKE :nameLike OR LOWER(patient.lastName) LIKE :nameLike)',
                                { nameLike:  `%${filterInput}%` }
                            );
                        }

                        let orderByField: string;
                        if (sortActive === 'firstName') {
                            orderByField = 'patient.firstName';
                        } else if (sortActive === 'draft'){
                            orderByField = `CASE WHEN appointment.record IS NULL THEN 0 WHEN record.draft = 'FALSE' THEN 2 ELSE 1 END`
                        } else {
                            orderByField = `appointment.${sortActive}` || 'appointment.start';
                        }
                        const [appointments, count]: [Appointment[], number] = await queryBuilder
                            .orderBy(orderByField, `${sortDirection}` as 'ASC' | 'DESC')
                            .limit(pageLimit)
                            .offset(pageIndex * pageLimit)
                            .getManyAndCount();

                        length = count;
                        slice = appointments
                    } catch (error) {
                        throw new Error(`Error fetching upcoming appointments: ${error}`);
                    }
                }
            } else {
                throw new Error('Authenticate yourself')
            }

            return {
                length,
                slice
            }    
        },
        pastAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});

            const repo = context.dataSource.getRepository(Appointment);
            const { pageIndex, pageLimit, sortActive, sortDirection, filterInput } = args;

            let length: number = 0;
            let slice: Appointment[] = [];   
            const now = getNow();

            if (me) {
                if (me.userRoleId === 3) {
                    try {
                        const queryBuilder = repo.createQueryBuilder('appointment')
                            .leftJoinAndSelect('appointment.doctor', 'doctor')
                            .leftJoinAndSelect('appointment.record', 'record')
                            .where('appointment.patientId = :patientId', {patientId: context.me.userId})
                            .andWhere('appointment.doctorId IS NOT NULL') 
                            .andWhere('appointment.end < :now', { now })
            
                        if (filterInput) {
                            queryBuilder.andWhere(
                                '(LOWER(doctor.firstName) LIKE :nameLike OR LOWER(doctor.lastName) LIKE :nameLike)',
                                { nameLike:  `%${filterInput}%` }
                            );
                        }

                        let orderByField: string;

                        if (sortActive === 'firstName') {
                            orderByField = 'doctor.firstName';
                        } else if (sortActive === 'record'){
                            orderByField = `CASE WHEN appointment.record IS NULL THEN 0 WHEN record.draft = 'FALSE' THEN 1 ELSE 0 END`
                        }else {
                            orderByField = `appointment.${sortActive}` || 'appointment.end';
                        }

                        const [appointments, count]: [Appointment[], number] = await queryBuilder
                            .orderBy(orderByField, `${sortDirection}` as 'ASC' | 'DESC')
                            .limit(pageLimit)
                            .offset(pageIndex * pageLimit)
                            .getManyAndCount();


                        length = count;
                        slice = appointments
                    } catch (error) {
                        throw new Error(`Error fetching past appointments: ${error}`);
                    }

                } else {
                    try {
                        const queryBuilder = repo.createQueryBuilder('appointment')
                            .leftJoinAndSelect('appointment.patient', 'patient')
                            .leftJoinAndSelect('appointment.record', 'record')
                            .where('appointment.doctorId = :doctorId', {doctorId: context.me.userId})
                            .andWhere('appointment.patientId IS NOT NULL') 
                            .andWhere('appointment.end < :now', { now })
            
                        if (filterInput) {
                            queryBuilder.andWhere(
                                '(LOWER(patient.firstName) LIKE :nameLike OR LOWER(patient.lastName) LIKE :nameLike)',
                                { nameLike:  `%${filterInput}%` }
                            );
                        }

                        let orderByField: string;

                        if (sortActive === 'firstName') {
                            orderByField = 'patient.firstName';
                        } else if (sortActive === 'draft'){
                            orderByField = `CASE WHEN appointment.record IS NULL THEN 0 WHEN record.draft = 'FALSE' THEN 2 ELSE 1 END`
                        }else {
                            orderByField = `appointment.${sortActive}` || 'appointment.end';
                        }

                        const [appointments, count]: [Appointment[], number] = await queryBuilder
                            .orderBy(orderByField, `${sortDirection}` as 'ASC' | 'DESC')
                            .limit(pageLimit)
                            .offset(pageIndex * pageLimit)
                            .getManyAndCount();


                        length = count;
                        slice = appointments
                    } catch (error) {
                        throw new Error(`Error fetching past appointments: ${error}`);
                    }
                }
            } else {
                throw new Error('Authenticate yourself')
            }

            return {
                length,
                slice
            }   
        },
        calendarAllAppointments:  async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const { monthStart, monthEnd, patientId } = args;

            if (!me) {
                throw new Error("Unauthorized action")
            }

            switch (me.userRoleId) {
                case 3: 
                    try {
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .leftJoinAndSelect('appointment.doctor', 'doctor')
                            .where('appointment.patientId = :patientId', { patientId: context.me.userId })
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error(`Error fetching all appointments: ${error}`);
                    }
                case 2: 
                    try {
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
                            .orWhere('appointment.doctorId IS NULL')
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart: new Date(monthStart),
                                monthEnd:  new Date(monthEnd)
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart: new Date(monthStart),
                                monthEnd:  new Date(monthEnd)
                            })
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error(`Error fetching all appointments: ${error}`);
                    }
                case 1: 
                    try {
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId })
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error(`Error fetching all appointments: ${error}`);
                    }
                default:
                    throw new Error('Action unauthorized')
            }
        },
        calendarMissedAppointments:  async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const { monthStart, monthEnd, patientId } = args;
            const now = getNow();

            if (!me) {
                throw new Error("Unauthorized action")
            }

            switch (me.userRoleId) {
                case 3: 
                    try {
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId: context.me.userId })
                            .andWhere('appointment.doctorId IS NULL')
                            .andWhere('appointment.start < :now', { now })
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error(`Error fetching missed appointments: ${error}`);
                    }
                case 2: 
                    const reservedTimes = await repo
                        .createQueryBuilder('appointment')
                        .select('appointment.start')
                        .where('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
                        .getRawMany();

                    const formattedReservedTimes: string[] = reservedTimes.map(rt => DateTime.fromJSDate(rt.appointment_start).toISO({ includeOffset: false }));

                    try {
                        const queryBuilder = repo
                            .createQueryBuilder('appointment')
                            .where('appointment.doctorId IS NULL')
                            .andWhere('appointment.start < :now', {now})
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart: new Date(monthStart),
                                monthEnd:  new Date(monthEnd)
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart: new Date(monthStart),
                                monthEnd:  new Date(monthEnd)
                            });

                        if (formattedReservedTimes.length>0) {
                            queryBuilder.andWhere('appointment.start NOT IN (:...reservedTimes)', { reservedTimes: formattedReservedTimes });
                        }

                        const monthSlice = await queryBuilder
                            .orderBy('appointment.start', 'DESC')
                            .getMany(); 

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error(`Error fetching missed appointments: ${error}`);
                    }
                case 1: 
                    try {
                        const queryBuilder = await repo
                            .createQueryBuilder('appointment')

                        if (patientId) {
                            queryBuilder
                                .where('appointment.patientId = :patientId', { patientId })
                        }

                        queryBuilder
                            .andWhere('appointment.doctorId IS NULL')
                            .andWhere('appointment.start < :now', {now})
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            
                        const monthSlice = await queryBuilder
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error(`Error fetching missed appointments: ${error}`);
                    }
                default:
                    throw new Error('Action unauthorized')
            }
        },
        calendarPendingAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const { monthStart, monthEnd, patientId } = args;
            const now = getNow();

            switch (me.userRoleId) {
                case 3:
                    try {
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId: context.me.userId })
                            .andWhere('appointment.doctorId IS NULL')
                            .andWhere('appointment.start > :now', {now})
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                            return {
                                monthSlice
                            }

                    } catch (error) {
                        throw new Error(`Error fetching pending appointments: ${error}`);
                    }
                case 2:
                    const reservedTimes = await repo
                            .createQueryBuilder('appointment')
                            .select('appointment.start')
                            .where('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
                            .getRawMany();

                    const formattedReservedTimes: string[] = reservedTimes.map(rt => DateTime.fromJSDate(rt.appointment_start).toISO({ includeOffset: false }));

                    try {
                        const queryBuilder = repo
                            .createQueryBuilder('appointment')
                            .where('appointment.doctorId IS NULL')
                            .andWhere('appointment.start > :now', {now})
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart: new Date(monthStart),
                                monthEnd:  new Date(monthEnd)
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart: new Date(monthStart),
                                monthEnd:  new Date(monthEnd)
                            });

                        if (formattedReservedTimes.length>0) {
                            queryBuilder.andWhere('appointment.start NOT IN (:...reservedTimes)', { reservedTimes: formattedReservedTimes });
                        }

                        const monthSlice = await queryBuilder
                            .orderBy('appointment.start', 'DESC')
                            .getMany(); 

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error(`Error fetching pending appointments: ${error}`);
                    }
                case 1: {    
                    try {
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.doctorId IS NULL')
                            .andWhere('appointment.patientId = :patientId', {patientId})
                            .andWhere('appointment.start > :now', {now})
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart: new Date(monthStart),
                                monthEnd:  new Date(monthEnd)
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart: new Date(monthStart),
                                monthEnd:  new Date(monthEnd)
                            })
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error("Error fetching pending appointments: "+error)
                    }
                }
                default:
                    throw new Error('Action unauthorized')
            }
        },
        calendarUpcomingAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const { monthStart, monthEnd, patientId} = args;
            const repo = context.dataSource.getRepository(Appointment);

            if (!me) {
                throw new Error('Unauthorized action')
            }

            const now = getNow();

            switch (me.userRoleId) {
                case 3:
                    try {
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId: context.me.userId })
                            .andWhere('appointment.doctorId IS NOT NULL')
                            .andWhere('appointment.start > :now', {now})
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error(`Error fetching upcoming appointments: ${error}`);
                    }
                case 2:
                    try {
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
                            .andWhere('appointment.patientId IS NOT NULL')
                            .andWhere('appointment.start > :now', {now})
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error(`Error fetching upcoming appointments: ${error}`);
                    }
                case 1: {    
                    try {
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId })
                            .andWhere('appointment.doctorId IS NOT NULL')
                            .andWhere('appointment.start > :now', {now})
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error("Error fetching pending appointments: "+error)
                    }
                }
                default:
                    throw new Error('Action unauthorized')
            }
        },
        calendarPastAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const { monthStart, monthEnd, patientId} = args;
            const repo = context.dataSource.getRepository(Appointment);

            if (!me) {
                throw new Error('Unauthorized action')
            }

            const now = getNow();

            switch (me.userRoleId) {
                case 3:
                    try {
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId: context.me.userId })
                            .andWhere('appointment.doctorId IS NOT NULL')
                            .andWhere('appointment.start < :now', {now})
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error(`Error fetching past appointments: ${error}`);
                    }
                case 2:
                    try {
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId IS NOT NULL', )
                            .andWhere('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
                            .andWhere('appointment.start < :now', {now})
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error(`Error fetching past appointments: ${error}`);
                    }
                case 1: {
                    try {
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', {patientId})
                            .andWhere('appointment.doctorId IS NOT NULL')
                            .andWhere('appointment.start < :now', {now})
                            .andWhere('appointment.start BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .andWhere('appointment.end BETWEEN :monthStart AND :monthEnd', {
                                monthStart,
                                monthEnd
                            })
                            .orderBy('appointment.start', 'DESC')
                            .getMany();

                        return {
                            monthSlice
                        }
                    } catch (error) {
                        throw new Error(`Error fetching past appointments: ${error}`);
                    }
                }
                default:
                throw new Error('Action unauthorized')
            }
        },
        isReservedDay: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const date: Date = args.date;

            if (me.userRoleId === 2) {
                try {
                    return repo
                        .createQueryBuilder('appointment')
                        .where({doctorId: context.me.userId})
                        .andWhere('appointment.allDay = TRUE AND appointment.start = :start', {start: date})
                        .getExists()
                } catch (error) {
                    throw new Error("Unexpected error checking if doctor day isReserved: "+error);
                }
            } else {
                return true; 
            }

        },
        countPendingAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const now = getNow(); 

            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }

            try {
                if (me.userRoleId === 3) {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId = :patientId', { patientId: me.id })
                        .andWhere('appointment.doctorId IS NULL')
                        .andWhere('appointment.start > :now', {now})
                        .getCount()
                } else {
                    const reservedTimes = await repo
                        .createQueryBuilder('appointment')
                        .select('appointment.start')
                        .where('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
                        .getRawMany();

                    const formattedReservedTimes: string[] = reservedTimes.map(rt => DateTime.fromJSDate(rt.appointment_start).toISO({ includeOffset: false }));

                    const queryBuilder = repo
                        .createQueryBuilder('appointment')
                        .leftJoinAndSelect('appointment.patient', 'patient')
                        .where('appointment.doctorId IS NULL')
                        .andWhere('appointment.start > :now', {now})
                        .groupBy('appointment.start')
                    
                    if (formattedReservedTimes.length>0) {
                        queryBuilder.andWhere('appointment.start NOT IN (:...reservedTimes)', { reservedTimes: formattedReservedTimes });
                    }

                    return queryBuilder.getCount()
                }
            } catch (error) {
                throw new Error('Unexpected error when counting pending appointments: '+error)

            }
        },
        countUpcomingAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);

            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }
            const now = getNow(); 

            try {
                if (me.userRoleId === 3) {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId = :patientId', { patientId: me.id })
                        .andWhere('appointment.doctorId IS NOT NULL')
                        .andWhere('appointment.start > :now', {now})
                        .getCount()
                } else {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.doctorId = :doctorId', { doctorId: me.id })
                        .andWhere('appointment.patientId IS NOT NULL')
                        .andWhere('appointment.start > :now', {now})
                        .getCount()
                }
            } catch (error) {
                throw new Error('Unexpected error when counting upcoming appointments: '+error)

            }
        },
        countPastAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);

            const now = getNow(); 

            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }

            try {
                if (me.userRoleId === 3) {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId = :patientId', { patientId: context.me.userId})
                        .andWhere('appointment.doctorId IS NOT NULL')
                        .andWhere('appointment.end < :now', { now })
                        .getCount();
                } else {
                    const count =  await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
                        .andWhere('appointment.patientId IS NOT NULL')
                        .andWhere('appointment.end < :now', { now })
                        .getCount();

                    return count;
                }
            } catch (error) {
                throw new Error('Unexpected error when counting past appointments: '+error)

            }
        },
        nextAppointment: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const aptRepo = context.dataSource.getRepository(Appointment);
            const recRepo = context.dataSource.getRepository(Record);

            if (!me || me.userRoleId === 1) {
                throw new Error("Unauthorized action")
            }
    
            const aptQueryBuilder = aptRepo
                .createQueryBuilder('appointment')
                // .leftJoinAndSelect('appointment.patient', 'patient')
                // .leftJoinAndSelect('appointment.doctor', 'doctor')
                .where('appointment.allDay = :allDay', {allDay: false})

            const recQueryBuilder = recRepo
                .createQueryBuilder('record')
                

            if (me.userRoleId === 2) {
                aptQueryBuilder
                    .andWhere('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
                recQueryBuilder
                    .innerJoin('record.patient', 'patient')
            } else {
                aptQueryBuilder
                    .andWhere('appointment.patientId = :patientId', { patientId: context.me.userId })
                    .andWhere('appointment.doctorId IS NOT NULL')
                recQueryBuilder
                    .innerJoin('record.patient', 'patient')
                    .innerJoin('record.doctor', 'doctor')
            }

            if (!await aptQueryBuilder
                .leftJoinAndSelect('appointment.patient', 'patient')
                .leftJoinAndSelect('appointment.doctor', 'doctor')
                .getExists()
            ) {
                return null;
            } 

            const now = DateTime.now().toJSDate();

            try {

                const futureAppointments = await aptQueryBuilder
                    .select(['appointment.start', 'appointment.id'])
                    .andWhere('appointment.start > :now', { now })
                    .orderBy('appointment.start', 'ASC')  
                    .getMany();

                if (!futureAppointments.length) {
                    return null;
                }
                const nextAppointmentId = futureAppointments[0].id;
                const nextAppointment = await aptRepo.findOne({ where: { id: nextAppointmentId }, relations: ['patient', 'doctor']});
            
                const patientId = nextAppointment.patientId;
                const doctorId = nextAppointment.doctorId;

                const previousAppointments = await aptRepo
                    .createQueryBuilder('appointment')
                    .where('appointment.patientId = :patientId', {patientId})
                    .andWhere('appointment.doctorId = :doctorId', {doctorId})
                    .andWhere('appointment.start < :now', {now})
                    .orderBy('appointment.start', 'DESC') 
                    .select(['appointment.start'])
                    .getMany()

                const previousAppointmentDate = previousAppointments[0] ? previousAppointments[0].start : null;
                let recordIds: any[]=[];

                if (me.userRoleId === 2) {
                    recordIds = await recQueryBuilder    
                        .where('record.patientId = :patientId', {patientId})
                        .andWhere('record.draft = :draft', {draft: false})
                        .orderBy('record.createdAt', 'DESC')
                        .select(['record.id'])
                        .getMany();
                } else {
                    recordIds = await recQueryBuilder
                        .where('record.patientId = :patientId', {patientId: context.me.userId})
                        .andWhere('record.doctorId = :doctorId', {doctorId})
                        .andWhere('record.draft = :draft', {draft: false})
                        .orderBy('record.createdAt', 'DESC') 
                        .select(['record.id'])
                        .getMany();
                }

                recordIds = recordIds.map(rec => rec.id);
                
                if (nextAppointment) {
                    const data = {
                        nextStart: nextAppointment.start,
                        nextEnd: nextAppointment.end,
                        nextId: nextAppointment.id,
                        previousAppointmentDate,
                        recordIds,
                        patient: nextAppointment.patient,
                        doctor: nextAppointment.doctor,
                        patientMessage: nextAppointment.patientMessage,
                        doctorMessage: nextAppointment.doctorMessage
                    };

                    return data;
                    
                } else {
                    return null;
                }
            } catch (error) {
                throw new Error('Unable to fetch next appointment: '+error);
            }

        },
        record: async (parent: null, args: any, context: AppContext) => {
            const recordId = args.recordId;
            const appointmentId = args.appointmentId;
            const repo = context.dataSource.getRepository(Record);

            try {
                if (appointmentId) {
                    return repo
                        .createQueryBuilder('record')
                        .leftJoinAndSelect('record.appointment', 'appointment')
                        .leftJoinAndSelect('record.patient', 'patient')
                        .leftJoinAndSelect('record.doctor', 'doctor')
                        .where({appointmentId})
                        .getOne();

                } else {
                    return repo
                        .createQueryBuilder('record')
                        .leftJoinAndSelect('record.patient', 'patient')
                        .leftJoinAndSelect('record.doctor', 'doctor')
                        .where({id: recordId})
                        .getOne();
                }
            } catch (error) {
                throw new Error(`Error fetching record: ${error}`);
            }
        },
        records: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});

            const repo = context.dataSource.getRepository(Record);
            const { pageIndex, pageLimit, sortActive, sortDirection, filterInput } = args;
            const advancedSearchInput = args.advancedSearchInput;

            let length: number = 0;
            let slice: Record[] = []; 

            if (!me || me.userRoleId === 1) {
                throw new Error("Unauthorized action")
            }

            if (me.userRoleId === 3) {
                try {
                    const queryBuilder = repo
                        .createQueryBuilder('record')
                        .leftJoinAndSelect('record.doctor', 'doctor')
                        .leftJoinAndSelect('record.patient', 'patient')
                        .where('record.patientId = :patientId', {patientId: context.me.userId })
                        .andWhere('record.draft = :draft', {draft: false})
        
                    if (filterInput) {
                        queryBuilder.andWhere(
                            '(LOWER(doctor.firstName) LIKE :nameLike OR LOWER(doctor.lastName) LIKE :nameLike)',
                            { nameLike:  `%${filterInput}%` }
                        );
                    }

                    if (advancedSearchInput) {
                        const { rangeStart, rangeEnd, textLike, titleLike } = advancedSearchInput;
                
                        if (rangeStart) {
                            queryBuilder.andWhere('record.updatedAt >= :rangeStart', { rangeStart });
                        }
                        if (rangeEnd) {
                            queryBuilder.andWhere('record.updatedAt <= :rangeEnd', { rangeEnd });
                        }
                
                        if (textLike) {
                            queryBuilder.andWhere('LOWER(record.text) LIKE :textLike', { textLike: `%${textLike.toLowerCase()}%` });
                        }
                
                        if (titleLike) {
                            queryBuilder.andWhere('LOWER(record.title) LIKE :titleLike', { titleLike: `%${titleLike.toLowerCase()}%` });
                        }
                    }

                    let orderByField: string;
                    if (sortActive === 'firstName') {
                        orderByField = 'doctor.firstName';
                    } else {
                        orderByField = `record.${sortActive}` || 'record.createdAt';
                    }
                    const [records, count]: [Record[], number] = await queryBuilder
                        .orderBy(orderByField, `${sortDirection}` as 'ASC' | 'DESC')
                        .limit(pageLimit)
                        .offset(pageIndex * pageLimit)
                        .getManyAndCount();

                    length = count;
                    slice = records;
                } catch (error) {
                    throw new Error(`Error fetching records: ${error}`);
                }
            } else {
                    try {
                        const queryBuilder = repo
                            .createQueryBuilder('record')
                            .where('record.doctorId = :doctorId', { doctorId: context.me.userId })
                            .leftJoinAndSelect('record.doctor', 'doctor')
                            .leftJoinAndSelect('record.patient', 'patient')
                            .andWhere('record.draft = :draft', { draft: false });
                    
                        if (filterInput) {
                            queryBuilder.andWhere(
                                '(LOWER(patient.firstName) LIKE :nameLike OR LOWER(patient.lastName) LIKE :nameLike)',
                                { nameLike: `%${filterInput}%` }
                            );
                        }
                    
                        if (advancedSearchInput) {
                            const { rangeStart, rangeEnd, textLike, titleLike } = advancedSearchInput;
                    
                            if (rangeStart) {
                                queryBuilder.andWhere('record.updatedAt >= :rangeStart', { rangeStart });
                            }
                            if (rangeEnd) {
                                queryBuilder.andWhere('record.updatedAt <= :rangeEnd', { rangeEnd });
                            }
                    
                            if (textLike) {
                                queryBuilder.andWhere('LOWER(record.text) LIKE :textLike', { textLike: `%${textLike.toLowerCase()}%` });
                            }
                    
                            if (titleLike) {
                                queryBuilder.andWhere('LOWER(record.title) LIKE :titleLike', { titleLike: `%${titleLike.toLowerCase()}%` });
                            }
                        }
                    
                        let orderByField: string;
                        if (sortActive === 'firstName') {
                            orderByField = 'patient.firstName';
                        } else {
                            orderByField = `record.${sortActive}` || 'record.createdAt';
                        }
                
                        const [records, count]: [Record[], number] = await queryBuilder
                            .orderBy(orderByField, sortDirection as 'ASC' | 'DESC')
                            .limit(pageLimit)
                            .offset(pageIndex * pageLimit)
                            .getManyAndCount();
                    
                        length = count;
                        slice = records;
                    } catch (error) {
                        throw new Error(`Error fetching records: ${error}`);
                    }
                    
            }
            return {
                length,
                slice
            }
        },
        drafts: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});

            const repo = context.dataSource.getRepository(Record);
            const { pageIndex, pageLimit, sortActive, sortDirection, filterInput } = args;
            const advancedSearchInput = args.advancedSearchInput;

            let length: number = 0;
            let slice: Record[] = []; 

            if (!me || me.userRoleId !== 2) {
                throw new Error("Unauthorized action")
            }
            try {
                const queryBuilder = repo
                    .createQueryBuilder('record')
                    .leftJoinAndSelect('record.doctor', 'doctor')
                    .leftJoinAndSelect('record.patient', 'patient')
                    .where('record.doctorId = :doctorId', {doctorId: me.id})
                    .andWhere('record.draft = :draft', {draft: true})

                if (filterInput) {
                    queryBuilder.andWhere(
                        '(LOWER(patient.firstName) LIKE :nameLike OR LOWER(patient.lastName) LIKE :nameLike)',
                        { nameLike:  `%${filterInput}%` }
                    );
                }

                if (advancedSearchInput) {
                    const { rangeStart, rangeEnd, textLike, titleLike } = advancedSearchInput;
            
                    if (rangeStart) {
                        queryBuilder.andWhere('record.updatedAt >= :rangeStart', { rangeStart });
                    }
                    if (rangeEnd) {
                        queryBuilder.andWhere('record.updatedAt <= :rangeEnd', { rangeEnd });
                    }
            
                    if (textLike) {
                        queryBuilder.andWhere('LOWER(record.text) LIKE :textLike', { textLike: `%${textLike.toLowerCase()}%` });
                    }
            
                    if (titleLike) {
                        queryBuilder.andWhere('LOWER(record.title) LIKE :titleLike', { titleLike: `%${titleLike.toLowerCase()}%` });
                    }
                }

                let orderByField: string;
                if (sortActive === 'firstName') {
                    orderByField = 'patient.firstName';
                } else {
                    orderByField = `record.${sortActive}` || 'record.createdAt';
                }

                const [records, count]: [Record[], number] = await queryBuilder
                    .orderBy(orderByField || 'record.createdAt', `${sortDirection}` as 'ASC' | 'DESC')
                    .limit(pageLimit)
                    .offset(pageIndex * pageLimit)
                    .getManyAndCount()

                length = count;
                slice = records
            } catch (error) {
                throw new Error(`Error fetching records: ${error}`);
            }
            return {
                length,
                slice
            }
        },
        countDoctorRequests: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(DoctorRequest);

            if (!me || me.userRoleId !== 1) {
                throw new Error("Unauthorized action");
            }

            try {
                return await repo.createQueryBuilder('doctor_request').getCount();
            } catch (error) {
                throw new Error("Unexpected error counting doctor requests: "+error);
            }
        },
        countDoctors: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(User);

            if (!me || me.userRoleId !== 1) {
                throw new Error("Unauthorized action");
            }

            try {
                return await repo
                    .createQueryBuilder('user')
                    .where('user.userRoleId = :id', {id: 2})
                    .getCount();
            } catch (error) {
                throw new Error("Unexpected error counting doctors: "+error);
            }
        },
        countPatients: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(User);
            const aptRepo = context.dataSource.getRepository(Appointment);

            if (!me || me.userRoleId === 3) {
                throw new Error("Unauthorized action");
            }

            try {
                if (me.userRoleId === 1) {
                    return await repo
                        .createQueryBuilder('user')
                        .where('user.userRoleId = :id', {id: 3})
                        .getCount();
                } else {
                    const result = await aptRepo
                        .createQueryBuilder('appointment')
                        .select('COUNT(DISTINCT appointment.patientId)', 'count')
                        .where('appointment.doctorId = :id', { id: context.me.userId })
                        .getRawOne();

                    return result.count;

                }
            } catch (error) {
                throw new Error("Unexpected error counting patients: "+error);
            }
        },
        countMissedAppointments: async (parent: null, args: any, context: AppContext)=> {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const now = new Date();

            if (!me) {
                throw new Error("Unauthorized action");
            }

            try {
                if (me.userRoleId !== 3) {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId IS NOT NULL')
                        .andWhere('appointment.doctorId IS NULL')
                        .andWhere('appointment.start < :now', { now })
                        .getCount();

                } else {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId = :id', {id: context.me.userId})
                        .andWhere('appointment.doctorId IS NULL')
                        .andWhere('appointment.start < :now', { now })
                        .getCount();
                }

            } catch (error) {
                throw new Error("Error counting missed appointments: "+error)
            }
        },
        countRecords: async (parent: null, args: any, context: AppContext)=> {
            const repo = context.dataSource.getRepository(Record);
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});

            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }

            try {
                if (me.userRoleId === 3) {
                    return await repo
                        .createQueryBuilder('record')
                        .where('record.draft = :draft', { draft: false })
                        .andWhere('record.patientId = :patientId', {patientId: context.me.userId})
                        .getCount();
                } else {
                    return  await repo
                        .createQueryBuilder('record')
                        .where('record.draft = :draft', { draft: false })
                        .andWhere('record.doctorId = :doctorId', {doctorId: context.me.userId})
                        .getCount();
                }    
            } catch (error) {
                throw new Error('Error counting medical records, '+error)
            }
        },
        countDrafts: async (parent: null, args: any, context: AppContext)=> {
            const repo = context.dataSource.getRepository(Record);
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});

            if (!me || me.userRoleId !== 2) {
                throw new Error('Unauthorized action')
            }

            try {
                return  await repo
                    .createQueryBuilder('record')
                    .where('record.doctorId = :doctorId', {doctorId: context.me.userId})
                    .andWhere('record.draft = :draft', {draft: true})
                    .getCount(); 

            } catch (error) {
                throw new Error('Error counting drafts, '+error)
            }
        },
        loadReceiverId: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId}); 
            if (me.userRoleId === 2) {
                const chatReceiver = await context.dataSource.getRepository(User).findOneBy({email: "admin@email.com"});
                return chatReceiver.id;
            } else {
                throw new Error("Unauthorized action");
            }
        },
        chatId: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});   
            let receiverId;

            if (me.userRoleId === 3) {
                throw new Error('Unauthorized action');
            }
            if (me.userRoleId === 1) {
                receiverId = args.receiverId;
            } else {
                const admin = await context.dataSource.getRepository(User).findOneBy({email: "admin@email.com"});
                receiverId = admin.id;
            }

            try {
                let chat = await context.dataSource.getRepository(Chat)
                    .createQueryBuilder('chat')
                    .innerJoin('chat.participants', 'participants')
                    .innerJoin('ChatParticipant', 'cp', 'cp.chatId = chat.id')
                    .where('participants.id IN (:...ids)', { ids: [context.me.userId, receiverId] })
                    .andWhere('cp.participantId = :userId', { userId: context.me.userId })  
                    .groupBy('chat.id')
                    .having('COUNT(participants.id) = 2') 
                    .getOne();

                if (!chat) {
                    chat = new Chat();
                    chat.participants = [
                        { id: context.me.userId } as User,  
                        { id: receiverId } as User         
                    ];
                    chat = await context.dataSource.getRepository(Chat).save(chat);

                    const chatParticipant1 = new ChatParticipant();
                    chatParticipant1.chat = chat; 
                    chatParticipant1.participant = { id: context.me.userId } as User; 
                    chatParticipant1.deletedAt = null; 
                
                    const chatParticipant2 = new ChatParticipant();
                    chatParticipant2.chat = chat;
                    chatParticipant2.participant = { id: receiverId } as User; 
                    chatParticipant2.deletedAt = null; 
                
                    await context.dataSource.getRepository(ChatParticipant).save([chatParticipant1, chatParticipant2]);
                }
                
                return chat.id;
            } catch (error) {
                throw new Error('Cannot get chat id: ' + error);
            }
        },
        messages: async (parent: null, args: any, context: AppContext) => {
            const chatId = args.chatId;
            const userId = context.me.userId;
        
            try {
                const chatParticipant = await context.dataSource.getRepository(ChatParticipant)
                    .createQueryBuilder('cp')
                    .where('cp.chatId = :chatId', { chatId })
                    .andWhere('cp.participantId = :userId', { userId })
                    .getOne();
        
                let query = context.dataSource.getRepository(Message)
                    .createQueryBuilder('message')
                    .leftJoinAndSelect('message.sender', 'sender')
                    .where('message.chatId = :chatId', { chatId })
                    .orderBy('message.createdAt', 'DESC');  
                
                if (chatParticipant && chatParticipant.deletedAt) {
                    query = query.andWhere('message.createdAt > :deletedAt', { deletedAt: chatParticipant.deletedAt });
                }
                const messages = await query.getMany();
                return messages;
            } catch (error) {
                throw new Error(`Failed to fetch messages for chatId ${chatId}: ${error}`);
            }
        },
        medicalRecordsFromIds:  async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});

            const repo = context.dataSource.getRepository(Record);
            const { ids, pageIndex, pageLimit, sortActive, sortDirection, filterInput } = args;
            const advancedSearchInput = args.advancedSearchInput;

            let length: number = 0;
            let slice: Record[] = []; 

            if (!me || me.userRoleId === 1) {
                throw new Error("Unauthorized action")
            }

            const queryBuilder = repo
                .createQueryBuilder('record')
                .where('record.draft = :draft', {draft: false})
                .andWhere('record.id IN (:...ids)', { ids })
                .leftJoinAndSelect('record.appointment', 'appointment')
                .innerJoin('appointment.doctor', 'doctor')
                .innerJoin('appointment.patient', 'patient')
            
            if (filterInput) {
                queryBuilder.andWhere(
                    '(LOWER(doctor.firstName) LIKE :nameLike OR LOWER(doctor.lastName) LIKE :nameLike)',
                    { nameLike:  `%${filterInput}%` }
                );
            }


            if (advancedSearchInput) {
                const { rangeStart, rangeEnd, textLike, titleLike } = advancedSearchInput;
        
                if (rangeStart) {
                    queryBuilder.andWhere('record.updatedAt >= :rangeStart', { rangeStart });
                }
                if (rangeEnd) {
                    queryBuilder.andWhere('record.updatedAt <= :rangeEnd', { rangeEnd });
                }
        
                if (textLike) {
                    queryBuilder.andWhere('LOWER(record.text) LIKE :textLike', { textLike: `%${textLike.toLowerCase()}%` });
                }
        
                if (titleLike) {
                    queryBuilder.andWhere('LOWER(record.title) LIKE :titleLike', { titleLike: `%${titleLike.toLowerCase()}%` });
                }
            }

            let orderByField: string;
            if (sortActive === 'firstName') {
                orderByField = 'doctor.firstName';
            } else {
                orderByField = `record.${sortActive}` || 'record.createdAt';
            }

            try {
                const [records, count]: [Record[], number] = await queryBuilder
                    .orderBy(orderByField, `${sortDirection}` as 'ASC' | 'DESC')
                    .limit(pageLimit)
                    .offset(pageIndex * pageLimit)
                    .getManyAndCount();

                length = count;
                slice = records;
            } catch (error) {
                throw new Error('Unable to fetch records '+error)
            }

            return {
                length,
                slice
            }
        },
        countTodayAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);

            if (!me || me.userRoleId !== 2) {
                throw new Error('Unauthorized action')
            }


            const startOfDay = new Date();
            startOfDay.setUTCHours(0, 0, 0, 0); 
            const endOfDay = new Date();
            endOfDay.setUTCHours(23, 59, 59, 999); 

            try {
                return await repo
                    .createQueryBuilder('appointment')
                    .where('appointment.doctorId = :doctorId', {doctorId: context.me.userId})
                    .andWhere('appointment.start >= :startOfDay', { startOfDay })
                    .andWhere('appointment.start <= :endOfDay', { endOfDay })
                    .getCount();  
        
            } catch (error) {
                throw new Error(`Error fetching today's appointments: ${error}`);
            }
        },
        countTotalHoursToday: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);

            if (!me || me.userRoleId !== 2) {
                throw new Error('Unauthorized action')
            }

            const startOfDay = new Date();
            startOfDay.setUTCHours(0, 0, 0, 0); 
            const endOfDay = new Date();
            endOfDay.setUTCHours(23, 59, 59, 999); 

            try {
                const appointments = await repo
                    .createQueryBuilder('appointment')
                    .where('appointment.doctorId = :doctorId', {doctorId: context.me.userId})
                    .select(['appointment.start', 'appointment.end'])
                    .andWhere('appointment.start >= :startOfDay', { startOfDay })
                    .andWhere('appointment.start <= :endOfDay', { endOfDay })
                    .getMany();
        
                let totalMinutes = 0;
        
                appointments.forEach(appointment => {
                    if (appointment.start && appointment.end) {
                        const startTime = new Date(appointment.start).getTime();
                        const endTime = new Date(appointment.end).getTime();
                        const durationInMinutes = (endTime - startTime) / (1000 * 60); 
                        totalMinutes += durationInMinutes;
                    }
                });
        
                const hours = Math.floor(totalMinutes / 60);
                const minutes = Math.floor(totalMinutes % 60);

                if (!hours && !minutes) {
                    return '-'
                }
        
                return `${hours} h ${minutes} min`;
        
            } catch (error) {
                throw new Error(`Error fetching total appointment time for today: ${error}`);
            }
        },
        countUnreadMessages: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User)
                .createQueryBuilder('user')
                .leftJoinAndSelect('user.chats', 'chats, chat.id')
                .where('user.id = :id', {id : context.me.userId})
                .getOne();

            if (!me || me.userRoleId === 3) {
                throw new Error('Unauthorized action')
            }

            const chatIds = me.chats.map((chat: Chat) => chat.id);

            try {
                if (chatIds.length>0) {
                    const count = await context.dataSource.getRepository(Message)
                        .createQueryBuilder('message')
                        .leftJoinAndSelect('message.sender', 'sender')
                        .where('message.chatId IN (:...chatIds)', { chatIds })
                        .andWhere('sender.id != :id', {id: context.me.userId})
                        .andWhere('message.isRead = :isRead', { isRead: false })
                        .getCount();
    
                    return count;
                }
                return 0;
            } catch (error) {
                throw new Error(error);
            }

        },
        countAllUnreadMessages: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User)
                .createQueryBuilder('user')
                .leftJoinAndSelect('user.chats', 'chats, chat.id')
                .where('user.id = :id', {id : context.me.userId})
                .getOne();

            if (!me || me.userRoleId === 3) {
                throw new Error('Unauthorized action')
            }

            const chatIds = me.chats.map((chat: Chat) => chat.id);

            try {
                if (chatIds.length>0) {
                    const unreadCounts = await context.dataSource.getRepository(Message)
                        .createQueryBuilder('message')
                        .select('sender.id', 'senderId')
                        .addSelect('COUNT(message.id)', 'count')
                        .leftJoin('message.sender', 'sender')
                        .where('message.chatId IN (:...chatIds)', { chatIds })
                        .andWhere('sender.id != :id', { id: context.me.userId })
                        .andWhere('message.isRead = :isRead', { isRead: false })
                        .groupBy('sender.id')
                        .getRawMany();

                    return unreadCounts;
                }
                return [];

            } catch (error) {
                throw new Error('Error in count all unread messages: '+error);
            }
        },
        feedbacks:  async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({ id: context.me.userId });
            const repo = context.dataSource.getRepository(Feedback);
            const { pageIndex, pageLimit, sortActive, sortDirection, filterInput } = args;
        
            if (!me || me.userRoleId !== 1) {
                throw new Error("Unauthorized action");
            }
        
            let slice: Feedback[];
            let length: number = 0;
        
            try {
                const queryBuilder = repo
                    .createQueryBuilder('feedback')
                    //.where('user.userRoleId = :userRoleId', { userRoleId: 2 });
        
                if (filterInput) {
                    queryBuilder.andWhere(
                        '(LOWER(feedback.name) LIKE :nameLike OR LOWER(feedback.name) LIKE :nameLike)',
                        { nameLike: `%${filterInput}%` }
                    );
                }
        
                if (sortActive === 'isRead') {
                    // queryBuilder
                    //     .addSelect(subQuery => {
                    //         return subQuery
                    //             .select('COUNT(message.id)', 'unreadMessages')
                    //             .from(Message, 'message')
                    //             .leftJoin('message.chat', 'chat')
                    //             .leftJoin('chat.participants', 'participants')
                    //             .where('message.isRead = :isRead', { isRead: false })
                    //             .andWhere('participants.id = user.id') 
                    //             .andWhere('message.senderId != :userId', { userId: context.me.userId });
                    //     }, 'unreadMessages')
                    //     .orderBy('unreadMessages', sortDirection as 'ASC' | 'DESC');
                } else {
                    queryBuilder.orderBy(`feedback.${sortActive}`, `${sortDirection}` as 'ASC' | 'DESC');
                }
        
                const [feedbacks, count]: [Feedback[], number] = await queryBuilder
                    .limit(pageLimit)
                    .offset(pageIndex * pageLimit)
                    .getManyAndCount();
        
                length = count;
                slice = feedbacks;
            } catch (error) {
                throw new Error(`Error fetching feedbacks: ${error}`);
            }
        
            return {
                slice,
                length
            };
        }  ,
        countFeedback: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Feedback);

            if (!me || me.userRoleId !== 1) {
                throw new Error("Unauthorized action");
            }

            try {
                return await repo
                    .createQueryBuilder('feedback')
                    .getCount();
            } catch (error) {
                throw new Error("Unexpected error counting feedback: "+error);
            }
        },  
        countUnreadFeedback: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Feedback);

            if (!me || me.userRoleId !== 1) {
                throw new Error("Unauthorized action");
            }

            try {
                return await repo
                    .createQueryBuilder('feedback')
                    .where('feedback.isRead = :isRead', { isRead: false })
                    .getCount();

            } catch (error) {
                throw new Error("Unexpected error counting unread feedback: "+error);
            }
        }, 
        feedback:   async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Feedback);

            if (me.userRoleId !== 1) {
                throw new Error("Unauthorized action");
            }
            try {
                return await repo
                    .createQueryBuilder('feedback')
                    .where('feedback.id = :id', { id: args.feedbackId })
                    .getOne();

            } catch (error) {
                throw new Error("Unexpected error fetching feedback: "+error);
            }
        }      
    }
} 