import jwt from "jsonwebtoken";
import { dataSource } from "../configurations/db.config";
import { User } from "./user/user.model";
import { TestApp } from "./test-app/test-app.model";
import { AppContext } from "./types";
import { Appointment } from "./appointment/appointment.model";

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
            const dbUser = await repo.findOneBy({id: userId});

            if (!dbUser) throw new Error('User not found');
            return dbUser;
        },
        users: async (parent: null, args: any, context: AppContext) => {
            try {
                return await context.dataSource.getRepository(User).find()
            } catch (error) {
                throw new Error(`Error fetching users: ${error}`);
            }
        },
        appointments: async (parent: null, args: any, context: AppContext) => {
            try {
                return await context.dataSource.getRepository(Appointment).find();
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
                                    doctorId: null
                                }
                            });
                        } catch (error) {
                            throw new Error(`Error fetching appointments: ${error}`);
                        }
                    case 2:
                        try {
                            return await context.dataSource.getRepository(Appointment).find({
                                where: { // fix doctor should see ALL pending appointments from all patients
                                    updatedAt: null,
                                    doctorId: me.id
                                }
                            });
                        } catch (error) {
                            throw new Error(`Error fetching appointments: ${error}`);
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