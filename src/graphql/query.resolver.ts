import jwt from "jsonwebtoken";
import { dataSource } from "../configurations/db.config";
import { User } from "./user/user.model";
import { TestApp } from "./test-app/test-app.model";
import { AppContext } from "./types";
import { Appointment } from "./appointment/appointment.model";
import { In, IsNull, LessThan, MoreThan, Not } from "typeorm";
import { DateTime } from "luxon";

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
            const repo = await context.dataSource.getRepository(Appointment)
            if (!me || me.userRoleId === 1) {
                throw new Error('Unauthorized action')
            }
            try {
                if (me.userRoleId === 3) {
                    const queryBuilder = repo
                        .createQueryBuilder('appointment')
                        .where('appointment.patientId = :patientId', {patientId: me.id})
                        .orWhere({ allDay: true })

                    return await queryBuilder.getMany();
                } else {
                    const queryBuilder = repo
                        .createQueryBuilder('appointment')
                        .where('appointment.doctorId = :doctorId', {doctorId: me.id})
                        .orWhere('appointment.updatedAt IS NULL')

                    return await queryBuilder.getMany();
                }
            } catch (error) {
                throw new Error(`Error fetching appointments: ${error}`);
            }
        },
        pendingAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});

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
        upcomingAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});

            if (me) {
                const now = DateTime.now().toISO();

                switch (me.userRoleId) {
                    case 3:
                        try {
                            return await context.dataSource.getRepository(Appointment).find({
                                where: {
                                    patientId: me.id,
                                    doctorId: Not(IsNull()),
                                    start: MoreThan(new Date(now)) // doesnt work ?
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
                                    updatedAt: Not(IsNull()),
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
        pastAppointments: async (parent: null, args: any, context: AppContext) => {
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            if (me) {
                const now = DateTime.now().toJSDate(); 

                switch (me.userRoleId) {
                    case 3:
                        try {
                            return await context.dataSource.getRepository(Appointment).find({
                                where: {
                                    patientId: me.id,
                                    doctorId: Not(IsNull()),
                                    start: LessThan(new Date(now))
                                },
                                order: {
                                    start: "DESC"
                                }
                            });
                        } catch (error) {
                            throw new Error(`Error fetching past appointments: ${error}`);
                        }
                    case 2:
                        try {
                            return await context.dataSource.getRepository(Appointment).find({
                                where: { 
                                    updatedAt: Not(IsNull()),
                                    doctorId: me.id,
                                    start: LessThan(new Date(now)) 
                                },
                                order: {
                                    start: "DESC"
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