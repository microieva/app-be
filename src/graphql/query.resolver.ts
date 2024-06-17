import {dataSource} from "../configurations/db.config";
import { TestApp } from "./test-app/test-app.model";

export const queries = {
    Query: {
        testApps: async (parent: TestApp, args: any, context: any) => {
            console.log('context - mystr: ', context.myStr)
            console.log('context - res: ', context.res)
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
        testApp: async (parent: TestApp, args: any, context: any) => {
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