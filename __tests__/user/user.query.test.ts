import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";

describe('user Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;

    beforeAll(() => {
        mockUserRepo = {
            findOneBy: jest.fn().mockReturnThis(),
        };

        context = {
            dataSource: {
                getRepository: jest.fn((entity) => {
                    if (entity === User) return mockUserRepo;
                    return null;
                }),
            },
            me: { userId: 1 },
            io:null
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return user details when the requester is authorized', async () => {
        const requester = { id: 1, userRoleId: 1 };
        const targetUser = { id: 2, firstName: 'Jane', lastName: 'Doe' };

        mockUserRepo.findOneBy.mockResolvedValueOnce(requester); 
        mockUserRepo.findOneBy.mockResolvedValueOnce(targetUser); 

        const result = await queries.Query.user(null, { userId: 2 }, context);

        expect(result).toEqual(targetUser);
        expect(mockUserRepo.findOneBy).toHaveBeenNthCalledWith(1, { id: context.me.userId });
        expect(mockUserRepo.findOneBy).toHaveBeenNthCalledWith(2, { id: 2 });
    });

    it('should throw an error if the requester is unauthorized', async () => {
        const requester = { id: 1, userRoleId: 2 };

        mockUserRepo.findOneBy.mockResolvedValue(requester);

        await expect(queries.Query.user(null, { userId: 2 }, context)).rejects.toThrow(
            'Unauthorized action'
        );
        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
    });

    it('should throw an error if the requester is not found', async () => {
        mockUserRepo.findOneBy.mockResolvedValue(null); 

        await expect(queries.Query.user(null, { userId: 2 }, context)).rejects.toThrow(
            'Unauthorized action'
        );
        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
    });

    it('should throw an error if the target user is not found', async () => {
        const requester = { id: context.me.userId, userRoleId: 1 }; 

        mockUserRepo.findOneBy.mockResolvedValueOnce(requester); 
        mockUserRepo.findOneBy.mockResolvedValue(null); 

        await expect(queries.Query.user(null, { userId: 2 }, context)).rejects.toThrow(
            'User not found'
        );
        expect(mockUserRepo.findOneBy).toHaveBeenNthCalledWith(1, { id: context.me.userId });
        expect(mockUserRepo.findOneBy).toHaveBeenNthCalledWith(2, { id: 2 });
    });
});
