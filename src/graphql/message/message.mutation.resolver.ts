import { Chat } from "../chat/chat.model";
import { AppContext, MutationResponse } from "../types";
import { User } from "../user/user.model";
import { Message } from "./message.model";

export const messageMutationResolver = {
    Mutation: {
        saveChatMessage: async(parent: null, args: any, context: AppContext)=> {
            const { chatId, content } = args;

            const repo = context.dataSource.getRepository(Message);
            const chat = await context.dataSource.getRepository(Chat).findOne({ where: { id: chatId }, relations: ['participants']});
            const sender = await context.dataSource.getRepository(User).findOne({ where: { id: context.me.userId } });
            const receiverId = chat.participants.find((participant: User) => participant.id !== context.me.userId).id;

            try {
                const newMessage = new Message();

                newMessage.content = content;
                newMessage.chat = chat;
                newMessage.sender = sender;
                newMessage.isRead = false;

                const savedMessage = await repo.save(newMessage);
                let msg;
                if (content.length > 250) {
                    const str = content.slice(0, 250);
                    msg = str+'...'
                } else {
                    msg = content
                }
                
                context.io.emit('receiveNotification', {
                    senderName: sender.firstName+' '+sender.lastName,
                    receiverId,
                    message: msg,
                    chatId
                });

                return savedMessage;
            } catch (error) {
                throw new Error(error);
            }
        },
        setIsReadToTrue: async(parent: null, args: any, context: AppContext)=> {
            const repo = context.dataSource.getRepository(Message);

            try {
                const unreadMessages = await repo
                    .createQueryBuilder('message')
                    .leftJoinAndSelect('message.sender', 'sender')
                    .where('message.chatId = :chatId', { chatId: args.chatId })
                    .andWhere('sender.id != :id', {id: context.me.userId})
                    .andWhere('message.isRead = :isRead', { isRead: false })
                    .getMany();

                unreadMessages.map(message => {
                    message.isRead = true;
                    repo.save(message)
                })

                return {
                    success: true,
                    message: "Set isRead as TRUE"
                }

            } catch (error) {
                return {
                    success: false,
                    message: error
                } as MutationResponse
            }
        }
    }
}