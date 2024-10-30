import { ChatParticipant } from "../../src/graphql/chat-participant/chat-participant.model";
import {chatParticipantMutationResolver} from "../../src/graphql/chat-participant/chat-participant.mutation.resolver";
import { AppContext } from "../../src/graphql/types";

describe('deleteChatForParticipant Mutation Resolver', () => {
    let context: AppContext;
    let mockChatParticipantRepo: any;

    beforeAll(() => {
        mockChatParticipantRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        context = {
            io:null,
            dataSource: {
                getRepository: jest.fn((entity) => {
                    if (entity === ChatParticipant) return mockChatParticipantRepo;
                }),
            },
            me: { userId: 1 },
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should set deletedAt and return success message if ChatParticipant exists', async () => {
        const chatId = 1;
        const chatParticipant = {
            id: 1,
            chat: { id: chatId },
            participant: { id: context.me.userId },
            deletedAt: null,
        };

        mockChatParticipantRepo.findOne.mockResolvedValue(chatParticipant);

        const result = await chatParticipantMutationResolver.Mutation.deleteChatForParticipant(null, { chatId }, context);

        expect(result).toEqual({
            success: true,
            message: "Chat cleared",
        });
        expect(mockChatParticipantRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({ deletedAt: expect.any(Date) })
        );
    });

    it('should throw an error if ChatParticipant is not found', async () => {
        const chatId = 1;

        mockChatParticipantRepo.findOne.mockResolvedValue(null); 

        await expect(
            chatParticipantMutationResolver.Mutation.deleteChatForParticipant(null, { chatId }, context)
        ).rejects.toThrow('ChatParticipant not found.');
    });

    it('should throw an error if saving ChatParticipant fails', async () => {
        const chatId = 1;
        const chatParticipant = {
            id: 1,
            chat: { id: chatId },
            participant: { id: context.me.userId },
            deletedAt: null,
        };

        mockChatParticipantRepo.findOne.mockResolvedValue(chatParticipant);
        mockChatParticipantRepo.save.mockRejectedValue(new Error('Save failed'));

        await expect(
            chatParticipantMutationResolver.Mutation.deleteChatForParticipant(null, { chatId }, context)
        ).rejects.toThrow('Failed to delete chat for participant: Save failed');
    });
});
