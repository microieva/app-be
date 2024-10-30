import { AppContext } from "../types";
import { ChatParticipant } from "./chat-participant.model";

export const chatParticipantMutationResolver = {
    Mutation: {
        deleteChatForParticipant: async (parent: null, args: any, context: AppContext) => {
            const repo = context.dataSource.getRepository(ChatParticipant);

            try {
                const chatParticipant = await repo.findOne({
                    where: {
                        chat: { id: args.chatId },    
                        participant: { id: context.me.userId }
                    }
                });
            
                if (!chatParticipant) {
                   throw new Error('ChatParticipant not found.');
                }
            
                chatParticipant.deletedAt = new Date();
            
                await repo.save(chatParticipant);
            
                return {
                    success: true,
                    message: "Chat cleared"
                }
            } catch (error) {
                throw new Error(`Failed to delete chat for participant: ${error.message}`);
            }
        }
    }
}