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

export const queries = {
    Query: {
        me: async (parent: null, args: any, context: AppContext)=> {
            const userId = context.me.userId;
            const requestRepo = context.dataSource.getRepository(DoctorRequest);
            const repo = context.dataSource.getRepository(User);

            const myAccount = await repo.findOne({where: {id: userId}});
            const myRequest = await requestRepo.findOneBy({id: userId});

            if (myRequest) {
                throw new Error(`This account request is in process. Please try later`);
            }
            return myAccount;
        },
        user: async (parent: null, args: any, context: AppContext)=> {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(User);

            if (!me || me.userRoleId !== 1) {
                throw new Error("Unauthorized action")
            }
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
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(User);
            const { pageIndex, pageLimit, sortActive, sortDirection, filterInput } = args;

            if (!me || me.userRoleId !== 1) {
                throw new Error("Unauthorized action")
            }
            let slice: User[];
            let length: number = 0;

            try {
                const queryBuilder = repo
                    .createQueryBuilder('user')
                    .where('user.userRoleId = :userRoleId', { userRoleId: 2});
    
                if (filterInput) {
                    queryBuilder.andWhere(
                        '(LOWER(user.firstName) LIKE :nameLike OR LOWER(user.lastName) LIKE :nameLike)',
                        { nameLike:  `%${filterInput}%` }
                    );
                }
                const [doctors, count]: [User[], number] = await queryBuilder
                    .orderBy(`user.${sortActive}` || 'user.firstName', `${sortDirection}` as 'ASC' | 'DESC')
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
            }
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

            if (!me || me.userRoleId !== 1) {
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
        justCreatedAppointment: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});

            if (!me) {
                throw new Error("Unauthorized action");
            }

            const repo = context.dataSource.getRepository(Appointment);

            try {
                const queryBuilder = repo
                    .createQueryBuilder('appointment')
                    .where('appointment.patientId = :patientId', {patientId: args.patientId})
                    .orderBy('appointment.createdAt', 'DESC')
                    
                return await queryBuilder.getOne();
            } catch (error) {
                throw new Error("Failed refetching new appointment "+error)
            }
        },
        nowAppointment: async (parent: null, args: any, context: AppContext)=> {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});

            if (!me || me.userRoleId !== 2) {
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
                            .andWhere('appointment.end > :now', {now})
                        
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
                        const [appointments, count]: [Appointment[], number] = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId: context.me.userId })
                            .andWhere('appointment.doctorId IS NOT NULL')
                            .andWhere('appointment.start > :now', { now })
                            .orderBy(`appointment.${sortActive}` || 'appointment.start', `${sortDirection}` as 'ASC' | 'DESC')
                            .limit(pageLimit)
                            .offset(pageIndex * pageLimit)
                            .getManyAndCount()

                        length = count;
                        slice = appointments
                    } catch (error) {
                        throw new Error(`Error fetching upcoming appointments: ${error}`);
                    }

                } else {
                    try {
                        const queryBuilder = repo.createQueryBuilder('appointment')
                            .leftJoinAndSelect('appointment.patient', 'patient')
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
                        const [appointments, count]: [Appointment[], number] = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId: me.id })
                            .andWhere('appointment.doctorId IS NOT NULL')
                            .andWhere('appointment.end < :now', { now })
                            .orderBy(`appointment.${sortActive}` || 'appointment.end', `${sortDirection}` as 'ASC' | 'DESC')
                            .limit(pageLimit)
                            .offset(pageIndex * pageLimit)
                            .getManyAndCount()

                        length = count;
                        slice = appointments
                    } catch (error) {
                        throw new Error(`Error fetching past appointments: ${error}`);
                    }

                } else {
                    try {
                        const queryBuilder = repo.createQueryBuilder('appointment')
                            .leftJoinAndSelect('appointment.patient', 'patient')
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
                        } else {
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
                        const monthSlice = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId })
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
            const repo = context.dataSource.getRepository(Appointment);
            

            if (!me || me.userRoleId === 1) {
                throw new Error("Unauthorized action")
            }
    
            const queryBuilder = repo
                .createQueryBuilder('appointment')
                .where('appointment.allDay = :allDay', {allDay: false})

            if (me.userRoleId === 2) {
                queryBuilder
                    .andWhere('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
            } else {
                queryBuilder
                    .andWhere('appointment.patientId = :patientId', { patientId: context.me.userId })
                    .andWhere('appointment.doctorId IS NOT NULL')
            }

            if (!await queryBuilder.getExists()) {
                return null;
            } 

            const now = getNow();

            const appointments = await queryBuilder
                .select(['appointment.start', 'appointment.id', 'appointment.end'])
                .orderBy('appointment.start', 'ASC') 
                .andWhere('appointment.start > :now', { now })
                .getMany();

            const id = appointments[0].id
            const nextAppointment = await queryBuilder
                .leftJoinAndSelect('appointment.patient', 'patient')
                .leftJoinAndSelect('appointment.doctor', 'doctor')
                .where({id})
                .getOne();

            return {
                nextStart: nextAppointment.start,
                nextEnd: nextAppointment.end,
                nextId: nextAppointment.id,
                patient: nextAppointment.patient,
                doctor: nextAppointment.doctor
            };

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
                        .leftJoinAndSelect('appointment.patient', 'patient')
                        .where({appointmentId})
                        .getOne();

                } else {
                    return repo
                        .createQueryBuilder('record')
                        .leftJoinAndSelect('record.appointment', 'appointment')
                        .leftJoinAndSelect('appointment.patient', 'patient')
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

            let length: number = 0;
            let slice: Record[] = []; 

            if (!me || me.userRoleId === 1) {
                throw new Error("Unauthorized action")
            }

            if (me.userRoleId === 3) {
                try {
                    const [records, count]: [Record[], number] = await repo
                        .createQueryBuilder('record')
                        .leftJoinAndSelect('record.appointment', 'appointment')
                        .where('appointment.patientId = :patientId', {patientId: me.id})
                        .andWhere('record.draft = :draft', {draft: false})
                        .orderBy(`record.${sortActive}` || 'record.createdAt', `${sortDirection}` as 'ASC' | 'DESC')
                        .limit(pageLimit)
                        .offset(pageIndex * pageLimit)
                        .getManyAndCount()

                    length = count;
                    slice = records
                } catch (error) {
                    throw new Error(`Error fetching records: ${error}`);
                }
            } else {
                try {
                    const queryBuilder = repo
                        .createQueryBuilder('record')
                        .leftJoinAndSelect('record.appointment', 'appointment')
                        .leftJoinAndSelect('appointment.patient', 'patient') 
                        .where('appointment.doctorId = :doctorId', {doctorId: me.id})
                        .andWhere('record.draft = :draft', {draft: false})
    
                    if (filterInput) {
                        queryBuilder.andWhere(
                            '(LOWER(patient.firstName) LIKE :nameLike OR LOWER(patient.lastName) LIKE :nameLike)',
                            { nameLike:  `%${filterInput}%` }
                        );
                    }
                    const [records, count]: [Record[], number] = await queryBuilder
                        .orderBy(`record.${sortActive}` || 'record.createdAt', `${sortDirection}` as 'ASC' | 'DESC')
                        .limit(pageLimit)
                        .offset(pageIndex * pageLimit)
                        .getManyAndCount()

                    length = count;
                    slice = records
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

            let length: number = 0;
            let slice: Record[] = []; 

            if (!me || me.userRoleId !== 2) {
                throw new Error("Unauthorized action")
            }
            try {
                const queryBuilder = repo
                    .createQueryBuilder('record')
                    .leftJoinAndSelect('record.appointment', 'appointment')
                    .leftJoinAndSelect('appointment.patient', 'patient') 
                    .where('appointment.doctorId = :doctorId', {doctorId: me.id})
                    .andWhere('record.draft = :draft', {draft: true})

                if (filterInput) {
                    queryBuilder.andWhere(
                        '(LOWER(patient.firstName) LIKE :nameLike OR LOWER(patient.lastName) LIKE :nameLike)',
                        { nameLike:  `%${filterInput}%` }
                    );
                }
                const [records, count]: [Record[], number] = await queryBuilder
                    .orderBy(`record.${sortActive}` || 'record.createdAt', `${sortDirection}` as 'ASC' | 'DESC')
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
            const now = getNow(); 

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
                        .andWhere('appointment.start < :now', {now})
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
                        .leftJoinAndSelect('record.appointment', 'appointment')
                        .where('appointment.patientId = :patientId', {patientId: context.me.userId})
                        .andWhere('record.draft = :draft', { draft: false })
                        .getCount();
                } else {
                    return  await repo
                        .createQueryBuilder('record')
                        .leftJoinAndSelect('record.appointment', 'appointment')
                        .where('appointment.doctorId = :doctorId', {doctorId: context.me.userId})
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
                    .leftJoinAndSelect('record.appointment', 'appointment')
                    .where('appointment.doctorId = :doctorId', {doctorId: context.me.userId})
                    .andWhere('record.draft = :draft', {draft: true})
                    .getCount(); 

            } catch (error) {
                throw new Error('Error counting drafts, '+error)
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
                const admin = await context.dataSource.getRepository(User).findOneBy({userRoleId: 1});
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
                
                    console.log('CHAT from queryBuilder- ', chat)

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
        
                let messagesQuery = context.dataSource.getRepository(Message)
                    .createQueryBuilder('message')
                    .leftJoinAndSelect('message.sender', 'sender')
                    .where('message.chatId = :chatId', { chatId })
                    .orderBy('message.createdAt', 'DESC');  
                
                if (chatParticipant && chatParticipant.deletedAt) {
                    messagesQuery = messagesQuery.andWhere('message.createdAt > :deletedAt', { deletedAt: chatParticipant.deletedAt });
                }

                return await messagesQuery.getMany();
            } catch (error) {
                throw new Error(`Failed to fetch messages for chatId ${chatId}: ${error}`);
            }
        }                   
    }
} 