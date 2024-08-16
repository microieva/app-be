import jwt from "jsonwebtoken";
import { DateTime } from "luxon";
import { User } from "./user/user.model";
import { Appointment } from "./appointment/appointment.model";
import { AppContext, LoginResponse, NextAppointmentResponse } from "./types";
import { Record } from "./record/record.model";
import { DoctorRequest } from "./doctor-request/doctor-request.model";

export const queries = {
    Query: {
        login: async (parent: null, args: any, context: AppContext) => {
            const input = args.directLoginInput;
            const dbUser = await context.dataSource.getRepository(User).findOneBy({ email: input.email});
            if (!dbUser) throw new Error(`Incorrect email`);

            const isValid = await dbUser.validatePassword(input.password);
            if (!isValid) throw new Error('Invalid password');

            let expiresIn = '1h'; 
            if (dbUser.userRoleId === 2) {
                expiresIn = '10h';
            }

            const token = jwt.sign({ userId: dbUser.id }, process.env.JWT_SECRET, { expiresIn });
            const currentTime = DateTime.now();
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
        },
        me: async (parent: null, args: any, context: AppContext)=> {
            const userId = context.me.userId;
            const requestRepo = context.dataSource.getRepository(DoctorRequest);
            const repo = context.dataSource.getRepository(User);

            const myAccount = await repo.findOne({where: {id: userId}, relations: ['userRole'] });
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
            const now = DateTime.now().toISO({ includeOffset: false });
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
            const now = DateTime.now().toISO({ includeOffset: false });

            let length: number = 0;
            let slice: Appointment[] = [];   

            if (me) {
                if (me.userRoleId === 3) {
                    try {
                        const [appointments, count]: [Appointment[], number] = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId: context.me.userId })
                            .andWhere('appointment.doctorId IS NULL')
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
            const now = DateTime.now().toISO({ includeOffset: false });

            if (me) {
                if (me.userRoleId === 3) {
                    try {
                        const [appointments, count]: [Appointment[], number] = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId: context.me.userId })
                            .andWhere('appointment.doctorId IS NOT NULL')
                            .andWhere('appointment.start > :now', { now: new Date(now) })
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
                            .andWhere('appointment.start > :now', { now: new Date(now) })
            
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

            const now = DateTime.now().toISO({ includeOffset: false });

            if (me) {
                if (me.userRoleId === 3) {
                    try {
                        const [appointments, count]: [Appointment[], number] = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId: me.id })
                            .andWhere('appointment.doctorId IS NOT NULL')
                            .andWhere('appointment.end < :now', { now: new Date(now) })
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
                            .andWhere('appointment.end < :now', { now: new Date(now) })
            
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
            const now = DateTime.now().toISO({ includeOffset: false });

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
            const now = DateTime.now().toISO({ includeOffset: false });

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

            const now = DateTime.now().toISO({ includeOffset: false });

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

            const now = DateTime.now().toISO({ includeOffset: false });

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
            // TO DO: fix reserved days
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
                return true; // for patients ?
            }

        },
        countPendingAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const now = DateTime.now().toISO({ includeOffset: false });

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
            const now = DateTime.now().toISO({ includeOffset: false });
            try {
                if (me.userRoleId === 3) {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId = :patientId', { patientId: me.id })
                        .andWhere('appointment.doctorId IS NOT NULL')
                        .andWhere('appointment.start > :now', {now: new Date(now)})
                        .getCount()
                } else {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.doctorId = :doctorId', { doctorId: me.id })
                        .andWhere('appointment.patientId IS NOT NULL')
                        .andWhere('appointment.start > :now', {now: new Date(now)})
                        .getCount()
                }
            } catch (error) {
                throw new Error('Unexpected error when counting upcoming appointments: '+error)

            }
        },
        countPastAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            //const now = DateTime.now().toJSDate(); 
            const now = DateTime.now().toISO({ includeOffset: false });

            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }

            try {
                if (me.userRoleId === 3) {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId = :patientId', { patientId: context.me.userId})
                        .andWhere('appointment.doctorId IS NOT NULL')
                        .andWhere('appointment.end < :now', { now: new Date(now) })
                        .getCount();
                } else {
                    const count =  await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.doctorId = :doctorId', { doctorId: context.me.userId })
                        .andWhere('appointment.patientId IS NOT NULL')
                        .andWhere('appointment.end < :now', { now: new Date(now) })
                        .getCount();

                    return count;
                }
            } catch (error) {
                throw new Error('Unexpected error when counting past appointments: '+error)

            }
        },
        nextAppointment: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);

            if (!me || me.userRoleId !== 2) {
                throw new Error("Unauthorized action")
            }
            try {
                const now = DateTime.now().toISO({ includeOffset: false });
        
                const nextAppointment = await repo
                    .createQueryBuilder('appointment')
                    .leftJoinAndSelect('appointment.patient', 'patient')
                    .where('appointment.doctorId = :doctorId', { doctorId: me.id })
                    .andWhere('appointment.allDay = :allDay', {allDay: false})
                    .andWhere('appointment.start > :now', { now })
                    .orderBy('appointment.start', 'ASC')
                    .getOne();
        
                return {
                    nextStart: DateTime.fromJSDate(nextAppointment.start).setZone('Europe/Helsinki').toISO(),
                    nextEnd: DateTime.fromJSDate(nextAppointment.end).setZone('Europe/Helsinki').toISO(),
                    nextId: nextAppointment.id
                } as NextAppointmentResponse;

            } catch (error) {
                throw new Error("Unexpected error from time tracker :"+error)
            }
        },
        record: async (parent: null, args: any, context: AppContext) => {
            const recordId = args.recordId;
            const appointmentId = args.appointmentId;

            try {
                if (appointmentId) {
                    return await context.dataSource.getRepository(Record)
                    .findOneBy({appointmentId: appointmentId});
                } else {
                    return await context.dataSource.getRepository(Record)
                        .findOneBy({id: recordId});
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
        countUserRecords: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const repo = context.dataSource.getRepository(Record);

            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }

            try {
                if (me.userRoleId === 3) {
                    const recordCount = await repo
                        .createQueryBuilder('record')
                        .leftJoinAndSelect('record.appointment', 'appointment')
                        .where('appointment.patientId = :patientId', {patientId: me.id})
                        .andWhere('record.draft = :draft', {draft: false})
                        .getCount();

                    return {
                        countRecords: recordCount,
                        countDrafts: 0
                    }
                } else {
                    const recordCount = await repo
                        .createQueryBuilder('record')
                        .leftJoinAndSelect('record.appointment', 'appointment')
                        .where('appointment.doctorId = :doctorId', {doctorId: me.id})
                        .andWhere('record.draft = :draft', {draft: false})
                        .getCount();

                    const draftCount = await repo
                        .createQueryBuilder('record')
                        .leftJoinAndSelect('record.appointment', 'appointment')
                        .where('appointment.doctorId = :doctorId', {doctorId: me.id})
                        .andWhere('record.draft = :draft', {draft: true})
                        .getCount();

                    return {
                        countRecords: recordCount,
                        countDrafts: draftCount
                    }
                }
            } catch (error) {
                throw new Error('Unexpected error getting record count: '+error)
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
        }
    }
} 