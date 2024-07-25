import jwt from "jsonwebtoken";
import { Not, IsNull, MoreThan, LessThan, In } from "typeorm";
import { DateTime } from "luxon";
import { dataSource } from "../configurations/db.config";
import { User } from "./user/user.model";
import { TestApp } from "./test-app/test-app.model";
import { Appointment } from "./appointment/appointment.model";
import { AppContext } from "./types";

export const queries = {
    Query: {
        login: async (parent: null, args: any, context: AppContext) => {
            const input = args.directLoginInput;
            const dbUser = await context.dataSource.getRepository(User).findOneBy({ email: input.email});
            if (!dbUser) throw new Error(`Incorrect email`);

            const isValid = await dbUser.validatePassword(input.password);
            if (!isValid) throw new Error('Invalid password');

            const token = jwt.sign({ userId: dbUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return token;
        },
        me: async (parent: null, args: any, context: AppContext)=> {
            const userId = context.me.userId;
            
            const repo = context.dataSource.getRepository(User);
            try {
                const me = await repo.findOne({where: {id: userId}, relations: ['userRole'] });
                return me;
            } catch (error) {
                throw new Error(`who am I? ${error}`)
            }
        },
        users: async (parent: null, args: any, context: AppContext) => {
            try {
                return await context.dataSource.getRepository(User).find()
            } catch (error) {
                throw new Error(`Error fetching users: ${error}`);
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
                        //.orWhere({ allDay: true })

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
                            .where('appointment.patientId = :patientId', { patientId: me.id })
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

            if (me) {
                if (me.userRoleId === 3) {
                    try {
                        const [appointments, count]: [Appointment[], number] = await repo
                            .createQueryBuilder('appointment')
                            .where('appointment.patientId = :patientId', { patientId: me.id })
                            .andWhere('appointment.doctorId IS NOT NULL')
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
                    const now = DateTime.now().toJSDate(); 
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
            const now = DateTime.now().toJSDate(); 
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
                const now = DateTime.now().toISO(); // be should use fi-FI locale

                switch (me.userRoleId) {
                    case 3:
                        try {
                            return await context.dataSource.getRepository(Appointment).find({
                                where: {
                                    patientId: me.id,
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
                                    doctorId: me.id,
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
                const now = DateTime.now().toJSDate(); // should use fi-Fi locale

                switch (me.userRoleId) {
                    case 3:
                        try {
                            return await context.dataSource.getRepository(Appointment).find({
                                where: {
                                    patientId: me.id,
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
                                    doctorId: me.id,
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
            // DOESNT WORK !!!!!
            if (me.userRoleId === 2) {
                try {
                    return repo
                        .createQueryBuilder('appointment')
                        .where({doctorId: me.id})
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
                        .andWhere('appointment.doctorId IS NULL')
                        .getCount()
                } else {
                    return await repo
                        .createQueryBuilder('appointment')
                        .andWhere('appointment.patientId IS NOT NULL')
                        .getCount()
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
                        .andWhere('appointment.doctorId IS NOT NULL')
                        .getCount()
                } else {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.doctorId = :doctorId', { doctorId: me.id })
                        .andWhere('appointment.patientId IS NOT NULL')
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
                        .andWhere('appointment.doctorId IS NOT NULL')
                        .andWhere('appointment.start < :now', { now: new Date(now) })
                        .getCount()
                } else {
                    return await repo
                        .createQueryBuilder('appointment')
                        .where('appointment.doctorId = :doctorId', { doctorId: me.id })
                        .andWhere('appointment.patientId IS NOT NULL')
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
                const now = DateTime.now();
                const fiveMinutesFromNow = now.plus({ minutes: 5 });
                
                const queryBuilder = repo
                    .createQueryBuilder('appointment')
                    .leftJoinAndSelect('appointment.patient', 'patient')
                    .where('appointment.doctorId = :doctorId', { doctorId: me.id })
                    .andWhere('appointment.start BETWEEN :now AND :fiveMinutesFromNow', {
                        now: now.toISO({ includeOffset: false }),
                        fiveMinutesFromNow: fiveMinutesFromNow.toISO({ includeOffset: false })
                    });
                return queryBuilder.getOne();

            } catch (error) {
                throw new Error("Unexpected error from time tracker :"+error)
            }
        },
        currentAppointment: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const repo = context.dataSource.getRepository(Appointment);

            if (!me || me.userRoleId !== 2) {
                throw new Error("Unauthorized action")
            }
            try {
                const now = DateTime.now().toISO({ includeOffset: false })
                
                const queryBuilder = repo
                    .createQueryBuilder('appointment')
                    .leftJoinAndSelect('appointment.patient', 'patient')
                    .where('appointment.doctorId = :doctorId', { doctorId: me.id })
                    .andWhere('appointment.start <= :now', { now })
                .andWhere('appointment.end > :now', { now });
                console.log('current APPOINTMENT: ', queryBuilder.getOne())
                return queryBuilder.getOne();

            } catch (error) {
                throw new Error("Unexpected error from current appointment time tracker :"+error)
            }
        },
        testApps: async (parent: null, args: any, context: AppContext) => {
            try {
                const repo = dataSource
                    .createQueryRunner().connection
                    .getRepository(TestApp);
                
                return await repo.find();
            } catch (error) {
                throw new Error(`Error fetching testApps: ${error}`);
            }
        },
        testApp: async (parent: null, args: any, context: AppContext) => {
            const id: number = args.testAppId;
            try {
                const repo = dataSource
                    .createQueryRunner().connection
                    .getRepository(TestApp);
                
                return await repo.findOneByOrFail({id});

            } catch (error) {
                throw new Error(`Test App not found: ${error}`);
            }

        }
    }
} 