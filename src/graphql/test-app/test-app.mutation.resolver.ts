import dataSource from "../../configurations/db.config";
import { MutationResponse } from "../types";
import { TestAppInput } from "./test-app.input";
import { TestApp } from "./test-app.model";

export const testAppMutationResolver = {
    Mutation: {
        saveTestApp: async (parent: TestApp, args: any, context: any) => {
            const input: TestAppInput = args.testAppInput;

            const repo = dataSource
                .createQueryRunner().connection
                .getRepository(TestApp);
            
            if (input.testAppName !== "") {
                try {
                    if (input.id) {
                        const dbTestApp = await repo.findOneBy({id: input.id });
                        const dbId = dbTestApp.id;
                        dbTestApp.testAppName = input.testAppName;
                        dbTestApp.isAppConnected = input.isAppConnected;
                        await repo.update(dbTestApp, {id: dbId});
                    } else {
                        const newTestApp = new TestApp();
                        newTestApp.testAppName = input.testAppName;
                        newTestApp.isAppConnected = input.isAppConnected;
                        await repo.save(newTestApp);
                    }
                    return {
                        success: true,
                        message: "Saved!"
                    } as MutationResponse;    
                
                } catch (error) {
                    return {
                        success: false,
                        message: `Unexpected error when saving testApp: ${error}`
                    } as MutationResponse;
                }
            } else {
                return {
                    success: false,
                    message: "testName is required"
                }
            }

        },
        deleteTestApp: async (parent: TestApp, args: any, context: any)  => {
            //const cntxt = context.myStr;
            console.log('MUTATION---------------------------------------: ', context.myStr)
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