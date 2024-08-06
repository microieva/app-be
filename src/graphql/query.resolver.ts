import jwt from "jsonwebtoken";
import { Not, IsNull, MoreThan, LessThan, In } from "typeorm";
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
                        '(user.firstName LIKE :filter OR user.lastName LIKE :filter)',
                        { filter: `%${filterInput}%` }
                    );
                }
                const [doctors, count]: [User[], number] = await queryBuilder
                    .orderBy(`user.${sortActive}` || 'user.firstName', `${sortDirection}` as 'ASC' | 'DESC')
                    .limit(pageLimit)
                    .offset(pageIndex * pageLimit)
                    .getManyAndCount();


                length = count;
                slice = doctors
            } catch (error) {
                throw new Error(`Error fetching pending appointments: ${error}`);
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
                        '(doctor_request.firstName LIKE :filter OR doctor_request.lastName LIKE :filter)',
                        { filter: `%${filterInput}%` }
                    );
                }
                const [requests, count]: [DoctorRequest[], number] = await queryBuilder
                    .orderBy(`doctor_request.${sortActive}` || 'doctor_request.firstName', `${sortDirection}` as 'ASC' | 'DESC')
                    .limit(pageLimit)
                    .offset(pageIndex * pageLimit)
                    .getManyAndCount();


                length = count;
                slice = requests
            } catch (error) {
                throw new Error(`Error fetching pending appointments: ${error}`);
            }
            return {
                slice,
                length
            }
        },
        allAppointments: async (parent: null, args: any, context: AppContext) => {
            try {
                return await context.dataSource.getRepository(Appointment).find();
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
            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }
            try {
                if (me.userRoleId === 3) {
                    const queryBuilder = repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId = :patientId', {patientId: me.id})

                    return await queryBuilder.getMany();
                } else {
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
        pendingAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const { pageIndex, pageLimit, sortActive, sortDirection, filterInput } = args;

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
                        
                        if (formattedReservedTimes.length>0) {
                            queryBuilder.andWhere('appointment.start NOT IN (:...reservedTimes)', { reservedTimes: formattedReservedTimes });
                        }

                        if (filterInput) {
                            queryBuilder.andWhere(
                                '(patient.firstName LIKE :filter OR patient.lastName LIKE :filter)',
                                { filter: `%${filterInput}%` }
                            );
                        }

                        const [appointments, count] = await queryBuilder
                            .orderBy(`appointment.${sortActive || 'start'}`, sortDirection ? sortDirection.toUpperCase() as 'ASC' | 'DESC' : 'ASC')
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
            const now = DateTime.now().toISO(); 
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
                            .where('appointment.doctorId = :doctorId', {doctorId: me.id})
                            .andWhere('appointment.patientId IS NOT NULL') 
                            .andWhere('appointment.start > :now', { now: new Date(now) })
            
                        if (filterInput) {
                            queryBuilder.andWhere(
                                '(patient.firstName LIKE :filter OR patient.lastName LIKE :filter)',
                                { filter: `%${filterInput}%` }
                            );
                        }
                        const [appointments, count]: [Appointment[], number] = await queryBuilder
                            .orderBy(`appointment.${sortActive}` || 'appointment.start', `${sortDirection}` as 'ASC' | 'DESC')
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
            const now = DateTime.now().toISO(); 
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
                            .where('appointment.doctorId = :doctorId', {doctorId: me.id})
                            .andWhere('appointment.patientId IS NOT NULL') 
                            .andWhere('appointment.end < :now', { now: new Date(now) })
            
                        if (filterInput) {
                            queryBuilder.andWhere(
                                '(patient.firstName LIKE :filter OR patient.lastName LIKE :filter)',
                                { filter: `%${filterInput}%` }
                            );
                        }
                        const [appointments, count]: [Appointment[], number] = await queryBuilder
                            .orderBy(`appointment.${sortActive}` || 'appointment.end', `${sortDirection}` as 'ASC' | 'DESC')
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
        calendarPendingAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});

            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }
            
            if (me) {
                switch (me.userRoleId) {
                    case 3:
                        try {
                            return await context.dataSource.getRepository(Appointment).find({
                                where: {
                                    patientId: me.id,
                                    doctorId: IsNull()
                                },
                                order: {
                                    start: "DESC"
                                }
                            });
                        } catch (error) {
                            throw new Error(`Error fetching pending appointments: ${error}`);
                        }
                    case 2:
                        const myAppointments = await context.dataSource.getRepository(Appointment).find({
                            where: {
                                doctorId: context.me.userId
                            }
                        })
                        // THIS WILL HAVE TO BE FIXED FOR "inside" ALL DAY:
                        const reservedTime = myAppointments.map(appointment => !appointment.allDay && appointment.start);

                        try {
                            return await context.dataSource.getRepository(Appointment).find({
                                where: { 
                                    updatedAt: IsNull(),
                                    start: Not(In(reservedTime))
                                },
                                order: {
                                    start: "ASC"
                                }
                            });
                        } catch (error) {
                            throw new Error(`Error fetching pending appointments: ${error}`);
                        }
                    default:
                    throw new Error('Action unauthorized')
                }
            } else {
                throw new Error('Authenticate yourself')
            }
        },
        calendarUpcomingAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }
            if (me) {
                const now = DateTime.now().toISO(); // be should use fi-FI locale ???

                switch (me.userRoleId) {
                    case 3:
                        try {
                            return await context.dataSource.getRepository(Appointment).find({
                                where: {
                                    patientId: context.me.userId,
                                    doctorId: Not(IsNull()),
                                    start: MoreThan(new Date(now)) 
                                },
                                order: {
                                    start: "ASC"
                                }
                            });
                        } catch (error) {
                            throw new Error(`Error fetching upcoming appointments: ${error}`);
                        }
                    case 2:
                        try {
                            return await context.dataSource.getRepository(Appointment).find({
                                where: { 
                                    patientId: Not(IsNull()),
                                    doctorId: context.me.userId,
                                    start: MoreThan(new Date(now))
                                },
                                order: {
                                    start: "ASC"
                                }
                            });
                        } catch (error) {
                            throw new Error(`Error fetching upcoming appointments: ${error}`);
                        }
                    default:
                    throw new Error('Action unauthorized')
                }
            } else {
                throw new Error('Authenticate yourself')
            }
        },
        calendarPastAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});

            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }
            
            if (me) {
                const now = DateTime.now().toJSDate(); // should use fi-Fi locale ???

                switch (me.userRoleId) {
                    case 3:
                        try {
                            return await context.dataSource.getRepository(Appointment).find({
                                where: {
                                    patientId: context.me.userId,
                                    doctorId: Not(IsNull()),
                                    end: LessThan(new Date(now))
                                },
                                order: {
                                    end: "DESC"
                                }
                            });
                        } catch (error) {
                            throw new Error(`Error fetching past appointments: ${error}`);
                        }
                    case 2:
                        try {
                            return await context.dataSource.getRepository(Appointment).find({
                                where: { 
                                    patientId: Not(IsNull()),
                                    doctorId: context.me.userId,
                                    end: LessThan(new Date(now))
                                },
                                order: {
                                    end: "DESC"
                                }
                            });
                        } catch (error) {
                            throw new Error(`Error fetching past appointments: ${error}`);
                        }
                    default:
                    throw new Error('Action unauthorized')
                }
            } else {
                throw new Error('Authenticate yourself')
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

            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }

            try {
                if (me.userRoleId === 3) {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId = :patientId', { patientId: me.id })
                        .andWhere('appointment.doctorId = :doctorId', {doctorId: IsNull()})
                        .getCount()
                } else {
                        const reservedTimes = await repo
                            .createQueryBuilder('appointment')
                            .select('appointment.start')
                            .where('appointment.doctorId = :doctorId', { doctorId: me.id })
                            .getRawMany();

                        const formattedReservedTimes: string[] = reservedTimes.map(rt => DateTime.fromJSDate(rt.appointment_start).toISO({ includeOffset: false }));

                        const queryBuilder = repo
                            .createQueryBuilder('appointment')
                            .leftJoinAndSelect('appointment.patient', 'patient')
                            .where('appointment.doctorId IS NULL')
                        
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

            try {
                if (me.userRoleId === 3) {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId = :patientId', { patientId: me.id })
                        .andWhere('appointment.doctorId = :doctorId', {doctorId: Not(IsNull())})
                        .getCount()
                } else {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.doctorId = :doctorId', { doctorId: me.id })
                        .andWhere('appointment.allDay = :allDay', {allDay: false}) 
                        .getCount()
                }
            } catch (error) {
                throw new Error('Unexpected error when counting pending appointments: '+error)

            }
        },
        countPastAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);
            const now = DateTime.now().toJSDate(); 

            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }

            try {
                if (me.userRoleId === 3) {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId = :patientId', { patientId: me.id })
                        .andWhere('appointment.doctorId = :doctorId', {doctorId: Not(IsNull())})
                        .andWhere('appointment.start < :now', { now: new Date(now) })
                        .getCount()
                } else {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.doctorId = :doctorId', { doctorId: me.id })
                        .andWhere('appointment.patientId = :patientId', {patientId: Not(IsNull())})
                        .andWhere('appointment.start < :now', { now: new Date(now) })
                        .getCount()
                }
            } catch (error) {
                throw new Error('Unexpected error when counting pending appointments: '+error)

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
                            '(patient.firstName LIKE :filter OR patient.lastName LIKE :filter)',
                            { filter: `%${filterInput}%` }
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
                        '(patient.firstName LIKE :filter OR patient.lastName LIKE :filter)',
                        { filter: `%${filterInput}%` }
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
        }
    }
} 