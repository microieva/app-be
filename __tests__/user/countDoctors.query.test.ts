import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";

describe('countDoctors Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getCount: jest.fn(),
        };

        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === User) return mockUserRepo;
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

    it('should throw an error for unauthorized users (non-admin role)', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });

        await expect(
            queries.Query.countDoctors(null, {}, context)
        ).rejects.toThrow("Unauthorized action");
    });

    it('should count doctors for an authorized admin user', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 1 });
        const doctorCount = 10;

        mockUserRepo.getCount.mockResolvedValue(doctorCount);

        const result = await queries.Query.countDoctors(null, {}, context);

        expect(result).toBe(doctorCount);
        expect(mockUserRepo.createQueryBuilder).toHaveBeenCalledWith('user');
        expect(mockUserRepo.where).toHaveBeenCalledWith('user.userRoleId = :id', { id: 2 });
        expect(mockUserRepo.getCount).toHaveBeenCalled();
    });

    it('should throw an error if an unexpected error occurs', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 1 });
        mockUserRepo.getCount.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.countDoctors(null, {}, context)
        ).rejects.toThrow("Unexpected error counting doctors: Error: Database error");
    });
});
