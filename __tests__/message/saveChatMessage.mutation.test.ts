import { Chat } from "../../src/graphql/chat/chat.model";
import { Message } from "../../src/graphql/message/message.model";
import { messageMutationResolver } from "../../src/graphql/message/message.mutation.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";

describe('saveChatMessage Mutation Resolver', () => {
    let context: AppContext;
    let mockMessageRepo: jest.Mocked<any>;;
    let mockChatRepo: jest.Mocked<any>;;
    let mockUserRepo: jest.Mocked<any>;;

    beforeAll(() => {
        mockMessageRepo = {
            save: jest.fn()
        };
        mockChatRepo = {
            findOne: jest.fn()
        };
        mockUserRepo = {
            findOne: jest.fn()
        };

        context = {
            dataSource: {
                getRepository: jest.fn((entity) => {
                    if (entity === Message) return mockMessageRepo;
                    if (entity === Chat) return mockChatRepo;
                    if (entity === User) return mockUserRepo;
                    return null;
                }),
            },
            me: { userId: 1 },
            io: { emit: jest.fn() },
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should save a new chat message and emit a notification', async () => {
        const chatId = 1;
        const content = 'Hello, this is a test message!';
        const chat = {
            id: chatId,
            participants: [{ id: 1 }, { id: 2 }],
        };
        const sender = { id: 1, firstName: 'John', lastName: 'Doe' };
        const receiverId = 2;
        const savedMessage = { id: 101, content, chat, sender };

        mockChatRepo.findOne.mockResolvedValue(chat);
        mockUserRepo.findOne.mockResolvedValue(sender);
        mockMessageRepo.save.mockResolvedValue(savedMessage);

        const result = await messageMutationResolver.Mutation.saveChatMessage(null, { chatId, content }, context);

        expect(result).toEqual(savedMessage);
        expect(mockMessageRepo.save).toHaveBeenCalledWith(expect.objectContaining({ content, chat, sender }));
        expect(context.io.emit).toHaveBeenCalledWith('receiveNotification', {
            sender: `${sender.firstName} ${sender.lastName}`,
            receiverId,
            message: content,
            chatId,
        });
    });

    it('should truncate and emit a shortened notification if content exceeds 250 characters', async () => {
        const chatId = 1;
        const content = 'A'.repeat(300); 
        const truncatedContent = content.slice(0, 250) + '...';
        const chat = {
            id: chatId,
            participants: [{ id: 1 }, { id: 2 }],
        };
        const sender = { id: 1, firstName: 'John', lastName: 'Doe' };
        const receiverId = 2;
        const savedMessage = { id: 101, content, chat, sender };

        mockChatRepo.findOne.mockResolvedValue(chat);
        mockUserRepo.findOne.mockResolvedValue(sender);
        mockMessageRepo.save.mockResolvedValue(savedMessage);

        const result = await messageMutationResolver.Mutation.saveChatMessage(null, { chatId, content }, context);

        expect(result).toEqual(savedMessage);
        expect(mockMessageRepo.save).toHaveBeenCalledWith(expect.objectContaining({ content, chat, sender }));
        expect(context.io.emit).toHaveBeenCalledWith('receiveNotification', {
            sender: `${sender.firstName} ${sender.lastName}`,
            receiverId,
            message: truncatedContent,
            chatId,
        });
    });

    it('should throw an error if saving the message fails', async () => {
        const chatId = 1;
        const content = 'Failed message';
        const chat = {
            id: chatId,
            participants: [{ id: 1 }, { id: 2 }],
        };
        const sender = { id: 1, firstName: 'John', lastName: 'Doe' };

        mockChatRepo.findOne.mockResolvedValue(chat);
        mockUserRepo.findOne.mockResolvedValue(sender);
        mockMessageRepo.save.mockRejectedValue(new Error('Save failed'));

        await expect(
            messageMutationResolver.Mutation.saveChatMessage(null, { chatId, content }, context)
        ).rejects.toThrow('Save failed');
    });

    it('should throw an error if chat is not found', async () => {
        const chatId = 1;
        const content = 'Hello, this is a test message!';
        
        mockChatRepo.findOne.mockResolvedValue(null); 

        await expect(
            messageMutationResolver.Mutation.saveChatMessage(null, { chatId, content }, context)
        ).rejects.toThrow('Chat not found');
    });

    it('should throw an error if sender is not found', async () => {
        const chatId = 1;
        const content = 'Hello, this is a test message!';
        const chat = {
            id: chatId,
            participants: [{ id: 1 }, { id: 2 }],
        };
        
        mockChatRepo.findOne.mockResolvedValue(chat);
        mockUserRepo.findOne.mockResolvedValue(null); 

        await expect(
            messageMutationResolver.Mutation.saveChatMessage(null, { chatId, content }, context)
        ).rejects.toThrow('Sender not found');
    });
});
