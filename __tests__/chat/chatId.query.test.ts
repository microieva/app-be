import { ChatParticipant } from "../../src/graphql/chat-participant/chat-participant.model";
import { Chat } from "../../src/graphql/chat/chat.model";
import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";

describe("chatId Query Resolver", () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockChatRepo: jest.Mocked<any>;
    let mockChatParticipantRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
        };

        mockChatRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            innerJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            having: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
            save: jest.fn(),
        };

        mockChatParticipantRepo = {
            save: jest.fn(),
        };

        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === User) return mockUserRepo;
                if (entity === Chat) return mockChatRepo;
                if (entity === ChatParticipant) return mockChatParticipantRepo;
                return null;
            }),
        };

        context = {
            dataSource: mockDataSource,
            me: { userId: 1 },
        } as AppContext;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("throws an error if the user's role is unauthorized (userRoleId is 3)", async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: context.me.userId, userRoleId: 3 });

        await expect(queries.Query.chatId(null, {}, context)).rejects.toThrow("Unauthorized action");
    });

    it("uses the provided receiverId if userRoleId is 1 (admin)", async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: context.me.userId, userRoleId: 1 });
        const receiverId = 4;
        mockChatRepo.getOne.mockResolvedValue(null);
        const mockChat = { id: 789, participants: [{ id: context.me.userId }, { id: receiverId }] };
        mockChatRepo.save.mockResolvedValue(mockChat);
    
        await expect(queries.Query.chatId(null, { receiverId }, context)).resolves.toEqual(mockChat.id);
    
        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
        expect(mockChatRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                participants: expect.arrayContaining([
                    { id: context.me.userId }, 
                    { id: receiverId }      
                ]),
            })
        );
    });
    

    it("uses admin's ID as receiverId if userRoleId is 2 (doctor)", async () => {
        mockUserRepo.findOneBy.mockResolvedValueOnce({ id: context.me.userId, userRoleId: 2 });
        mockUserRepo.findOneBy.mockResolvedValueOnce({ id: 5, userRoleId: 1 });
        mockChatRepo.getOne.mockResolvedValue(null);
    
        const mockChat = { id: 123, participants: [{ id: context.me.userId }, { id: 5 }] };
        mockChatRepo.save.mockResolvedValue(mockChat);
    
        const result = await queries.Query.chatId(null, {}, context);
    
        expect(result).toEqual(mockChat.id);
        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ userRoleId: 1 });
        expect(mockChatRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                participants: expect.arrayContaining([
                    { id: context.me.userId }, 
                    { id: 5 },                 
                ]),
            })
        );
    });
    

    it("fetches an existing chat if it exists between the current user and receiver", async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: context.me.userId, userRoleId: 2 });
        mockUserRepo.findOneBy.mockResolvedValueOnce({ id: 5, userRoleId: 1 });

        mockChatRepo.getOne.mockResolvedValue({ id: 123 });
        const result = await queries.Query.chatId(null, {}, context);

        expect(result).toBe(123);
    });

    it("creates a new chat and chat participants if no chat is found", async () => {
        mockUserRepo.findOneBy.mockResolvedValueOnce({ id: context.me.userId, userRoleId: 2 });
        mockUserRepo.findOneBy.mockResolvedValueOnce({ id: 5, userRoleId: 1 });
        mockChatRepo.getOne.mockResolvedValue(null);

        const mockChat = { id: 456 };
        mockChatRepo.save.mockResolvedValue(mockChat);

        const result = await queries.Query.chatId(null, {}, context);

        expect(mockChatRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                participants: expect.arrayContaining([
                    { id: context.me.userId },
                    { id: 5 },
                ]),
            })
        );

        expect(mockChatParticipantRepo.save).toHaveBeenCalledTimes(1);
        expect(result).toBe(mockChat.id);
    });

    it("throws an error if an exception occurs during chat retrieval or creation", async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: context.me.userId, userRoleId: 2 });
        mockUserRepo.findOneBy.mockResolvedValueOnce({ id: 5, userRoleId: 1 });
        mockChatRepo.getOne.mockRejectedValue(new Error("Database error"));

        await expect(queries.Query.chatId(null, {}, context)).rejects.toThrow("Cannot get chat id: Error: Database error");
    });
});
