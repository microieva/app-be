import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { ChatParticipant } from "../../src/graphql/chat-participant/chat-participant.model";
import { Message } from "../../src/graphql/message/message.model";

describe('messages Query Resolver', () => {
    let context: AppContext;
    let mockChatParticipantRepo: jest.Mocked<any>;
    let mockMessageRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockChatParticipantRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
        };

        mockMessageRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        };

        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === ChatParticipant) return mockChatParticipantRepo;
                if (entity === Message) return mockMessageRepo;
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

    it('should fetch messages if the user is a participant in the chat', async () => {
        const chatId = 1;
        const mockChatParticipant = { deletedAt: null };
        mockChatParticipantRepo.getOne.mockResolvedValue(mockChatParticipant);
        const mockMessages = [{ id: 1, chatId, content: 'Hello' }];
        mockMessageRepo.getMany.mockResolvedValue(mockMessages);

        const result = await queries.Query.messages(null, { chatId }, context);

        expect(result).toEqual(mockMessages);
        expect(mockChatParticipantRepo.getOne).toHaveBeenCalledWith();
        expect(mockMessageRepo.getMany).toHaveBeenCalled();
    });

    it('should filter messages based on deletedAt if the chatParticipant is deleted', async () => {
        const chatId = 1;
        const deletedAt = new Date();
        const mockChatParticipant = { deletedAt };
        mockChatParticipantRepo.getOne.mockResolvedValue(mockChatParticipant);
        const mockMessages = [{ id: 1, chatId, content: 'Hello' }];
        mockMessageRepo.getMany.mockResolvedValue(mockMessages);

        await queries.Query.messages(null, { chatId }, context);

        expect(mockMessageRepo.andWhere).toHaveBeenCalledWith('message.createdAt > :deletedAt', { deletedAt });
    });

    it('should throw an error if fetching chatParticipant fails', async () => {
        const chatId = 1;
        mockChatParticipantRepo.getOne.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.messages(null, { chatId }, context)
        ).rejects.toThrow(`Failed to fetch messages for chatId ${chatId}: Error: Database error`);
    });

    it('should throw an error if fetching messages fails', async () => {
        const chatId = 1;
        const mockChatParticipant = { deletedAt: null };
        mockChatParticipantRepo.getOne.mockResolvedValue(mockChatParticipant);
        mockMessageRepo.getMany.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.messages(null, { chatId }, context)
        ).rejects.toThrow(`Failed to fetch messages for chatId ${chatId}: Error: Database error`);
    });
});
