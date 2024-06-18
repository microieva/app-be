import {dataSource} from "../../configurations/db.config";
import { AppContext, MutationResponse } from "../types";
import { TestAppInput } from "./test-app.input";
import { TestApp } from "./test-app.model";

export const testAppMutationResolver = {
    Mutation: {
        saveTestApp: async (parent: TestApp, args: any, context: AppContext) => {
            const input: TestAppInput = args.testAppInput;

            const repo = dataSource
                .createQueryRunner().connection
                .getRepository(TestApp);
            
            if (input.testAppName !== "" && input.testAppName !== null) {
                try {
                    if (input.id) {
                        const dbTestApp = await repo.findOneBy({id: input.id });
 
                        dbTestApp.id = input.id,
                        dbTestApp.testAppName = input.testAppName;
                        dbTestApp.isAppConnected = input.isAppConnected;

                        await repo.save(dbTestApp);
                        return {
                            success: true,
                            message: "Updated!"
                        } as MutationResponse;    
                    } else {
                        const newTestApp = new TestApp();
                        
                        newTestApp.testAppName = input.testAppName;
                        newTestApp.isAppConnected = input.isAppConnected;

                        await repo.save(newTestApp);
                        return {
                            success: true,
                            message: "Saved!"
                        } as MutationResponse;    
                    }
                } catch (error) {
                    return {
                        success: false,
                        message: `Unexpected error when saving testApp: ${error}`
                    } as MutationResponse;
                }
            } else {
                return {
                    success: false,
                    message: "testName is required and can not be empty"
                }
            }

        },
        deleteTestApp: async (parent: TestApp, args: any, context: AppContext)  => {
            const id: number = args.testAppId;

            const repo = dataSource
                .createQueryRunner().connection
                .getRepository(TestApp)

            const dbTestApp = await repo.findOneOrFail({ where: { id } });
            const dbId = dbTestApp.id;

            if (dbTestApp) {
                try {
                    await repo.delete(dbId);
                    return {
                        success: true,
                        message: `testApp deleted successfuly`
                    }
                }catch (error) {
                    return {
                        success: false,
                        message: `Unexpected error on deleting testApp: ${error}`
                    }
                }

            } else {
                return {
                    success: false,
                    message: "testApp not found"
                }
            }
        }
    }
}