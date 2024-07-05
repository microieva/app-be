import jwt from "jsonwebtoken";
import { dataSource } from "../configurations/db.config";
import { User } from "./user/user.model";
import { TestApp } from "./test-app/test-app.model";
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
        users: async (parent: null, args: any, context: AppContext) => {
            try {
                return await context.dataSource.getRepository(User).find()
            } catch (error) {
                throw new Error(`Error fetching users: ${error}`);
            }
        },
        me: async (parent: null, args: any, context: AppContext)=> {
            const userId = context.me.userId;
            const repo = context.dataSource.getRepository(User);
            const dbUser = await repo.findOneBy({id: userId});

            if (!dbUser) throw new Error('User not found');
            return dbUser;
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