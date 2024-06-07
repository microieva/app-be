import dataSource from "../../configurations/db.config";
import { MutationResponse } from "../types";
import { TestAppInput } from "./test-app.input";
import { TestApp } from "./test-app.model";

export const testAppMutationResolver = {
    Mutation: {
        saveTestApp: async (parent: TestApp, args: any, context: any) => {
            const input: TestAppInput = args.testAppInput;
            try {
                const repo = dataSource
                    .createQueryRunner().connection
                    .getRepository(TestApp);
                
                const newTestApp = new TestApp();
                if (input) {
                    newTestApp.testAppName = input.testAppName;
                    newTestApp.isAppConnected = input.isAppConnected;
                }
                await repo.save(newTestApp);
                
                return {
                    success: true,
                    message: null
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: `Unexpected error when saving testApp: ${error}`
                } as MutationResponse;
            }
        }
    }
}