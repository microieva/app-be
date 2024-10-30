import { Chat } from "../chat/chat.model";
import { AppContext } from "../types";
import { User } from "../user/user.model";
import { Message } from "./message.model";

export const messageMutationResolver = {
    Mutation: {
        saveChatMessage: async(parent: null, args: any, context: AppContext)=> {
            const { chatId, content } = args;

            const repo = context.dataSource.getRepository(Message);
            const chat = await context.dataSource.getRepository(Chat).findOne({ where: { id: chatId }, relations: ['participants']});
            if (!chat) {
                throw new Error("Chat not found")
            }
            
            const sender = await context.dataSource.getRepository(User).findOne({ where: { id: context.me.userId } });
            if (!sender) {
                throw new Error("Sender not found")
            }
            const receiverId = chat.participants.find((participant: User) => participant.id !== context.me.userId).id;

            try {
                const newMessage = new Message();

                newMessage.content = content;
                newMessage.chat = chat;
                newMessage.sender = sender;

                const savedMessage = await repo.save(newMessage);
                let msg;
                if (content.length > 250) {
                    const str = content.slice(0, 250);
                    msg = str+'...'
                } else {
                    msg = content
                }
                
                context.io.emit('receiveNotification', {
                    sender: sender.firstName+' '+sender.lastName,
                    receiverId,
                    message: msg,
                    chatId
                });

                return savedMessage;
            } catch (error) {
                throw new Error(error);
            }
        }
    }
}