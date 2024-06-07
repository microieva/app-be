import dataSource from "../configurations/db.config";
import { TestApp } from "./test-app/test-app.model";

export const queries = {
    Query: {
        testApps: async (parent: TestApp, args: any, context: any) => {
            try {
                const repo = dataSource
                    .createQueryRunner().connection
                    .getRepository(TestApp);
                
                return await repo.find();
            } catch (error) {
                console.error("Error fetching testApps:", error);
                throw new Error("Unable to fetch testApps. Please try again later.");
            }
        }
    }
}