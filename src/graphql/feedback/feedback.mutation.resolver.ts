import { Feedback } from "./feedback.model";
import { AppContext, MutationResponse } from "../types";
import { FeedbackInput } from "./feedback.input";
import { User } from "../user/user.model";
import { sendEmailNotification } from "../../services/email.service";
import { FEEDBACK_CREATED } from "../constants";

export const feedbackMutationResolver = {
    Mutation: {
        saveFeedback: async(parent: null, args: any, context: AppContext)=> {
            const repo = context.dataSource.getRepository(Feedback);
            const {name, email, text} = args.feedbackInput as FeedbackInput;

            const newFeedback = new Feedback();
            newFeedback.name = name;
            newFeedback.email = email;
            newFeedback.text = text;

            const emailInfo = {
                name:newFeedback.name,
                email:newFeedback.email,
                text:newFeedback.text
            } as Feedback;

            try {
                const data = await repo.save(newFeedback);

                sendEmailNotification(emailInfo, FEEDBACK_CREATED);
                context.io.to('admins').emit(FEEDBACK_CREATED, {
                    event: FEEDBACK_CREATED,
                    message: "NEW FEEDBACK !",
                    data
                });
                

                return {
                    success: true,
                    message: "Thank you, we received your feedback!"
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: error
                } as MutationResponse;
            }
        },
        deleteFeedbacksByIds: async(parent: null, args: any, context: AppContext)=> {
            const repo = context.dataSource.getRepository(Feedback);
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const feedbackIds = args.feedbackIds;

            if (me.userRoleId !== 1) {
                return {
                    success:false,
                    message: "Unauthorized action"
                } as MutationResponse;
            }

            const dbFeedbacks = await repo
                .createQueryBuilder('feedback')
                .where('feedback.id IN (:...feedbackIds)', { feedbackIds})
                .getMany();
            
            if (dbFeedbacks.length === 0) {
                return {
                    success:false,
                    message: "No feedbacks found"
                } as MutationResponse;
            }

            try {
                await repo.remove(dbFeedbacks);
        
                return {
                    success: true,
                    message: `${dbFeedbacks.length} deleted successfully`,
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: error
                } as MutationResponse;
            }
        },
        markAsReadFeedbacks:async(parent: null, args: any, context: AppContext)=> {
            const repo = context.dataSource.getRepository(Feedback);
            const me = await context.dataSource.getRepository(User).findOneBy({id : context.me.userId});
            const feedbackIds = args.feedbackIds;

            if (me.userRoleId !== 1) {
                return {
                    success:false,
                    message: "Unauthorized action"
                } as MutationResponse;
            }
            const dbFeedbacks = await repo
                .createQueryBuilder('feedback')
                .where('feedback.id IN (:...feedbackIds)', { feedbackIds })
                .getMany();

            if (dbFeedbacks.length === 0) {
                return {
                    success: false,
                    message: "Feedbacks not found"
                } as MutationResponse;
            }
            try {
                dbFeedbacks.map((feedback) => {
                    feedback.isRead = true
                });
                
                await repo.save(dbFeedbacks);
                return {
                    success: true,
                    message: `${dbFeedbacks.length} successfuly updated`,
                } as MutationResponse;

            }catch (error) {
                return {
                    success: false,
                    message: error
                } as MutationResponse;
            }
        }
    }
}