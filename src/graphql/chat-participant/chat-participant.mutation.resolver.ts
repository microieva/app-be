//import { Chat } from "../chat/chat.model";
import { AppContext } from "../types";
import { ChatParticipant } from "./chat-participant.model";

export const chatParticipantMutationResolver = {
    Mutation: {
        deleteChatForParticipant: async (parent: null, args: any, context: AppContext) => {
            const repo = context.dataSource.getRepository(ChatParticipant);
            //const chatRepo = context.dataSource.getRepository(Chat);

            try {
                /*const otherParticipant = await repo.createQueryBuilder('cp')
                    .where('cp.chatId = :chatId', { chatId: args.chatId })
                    .andWhere('cp.participantId != :userId', { userId: context.me.userId })
                    .andWhere('cp.deletedAt IS NULL') 
                    .getOne();

                if (!otherParticipant) {
                    await chatRepo.delete({ id: args.chatId });
                    await repo.createQueryBuilder()
                        .delete()
                        .where('chatId = :chatId', { chatId: args.chatId })
                        .execute();

                    return {
                        success: true,
                        message: "Chat deleted from the database"
                    };
                }*/

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