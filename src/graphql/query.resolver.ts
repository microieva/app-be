import {dataSource} from "../configurations/db.config";
import { TestApp } from "./test-app/test-app.model";
import { AppContext } from "./types";
import { User } from "./user/user.model";

export const queries = {
    Query: {
        login: async (parent: User, args: any, context: AppContext) => {
            //const input = args.directLoginInput;
            return {
                success: true,
                message: 'Logged In',
                token: "xxx"
            }
        },
        testApps: async (parent: TestApp, args: any, context: AppContext) => {
            try {
                const repo = dataSource
                    .createQueryRunner().connection
                    .getRepository(TestApp);
                
                return await repo.find();
            } catch (error) {
                console.error("Error fetching testApps:", error);
                throw new Error("Unable to fetch testApps. Please try again later.");
            }
        },
        testApp: async (parent: TestApp, args: any, context: AppContext) => {
            const id: number = args.testAppId;
            try {
                const repo = dataSource
                    .createQueryRunner().connection
                    .getRepository(TestApp);
                
                return await repo.findOneByOrFail({id});

            } catch (error) {
                console.error("Error fetching testApp", error);
                throw new Error("Unable to fetch testApp. Please try again later.");
            }

        }
    }
}