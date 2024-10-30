import { DoctorRequest } from "../../src/graphql/doctor-request/doctor-request.model";
import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";

describe('countDoctorRequests Query Resolver', () => {
    let context: AppContext;
    let mockDoctorRequestRepo: jest.Mocked<any>;
    let mockUserRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockDoctorRequestRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            getCount: jest.fn(),
        };

        mockUserRepo = {
            findOneBy: jest.fn(),
        };

        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === DoctorRequest) return mockDoctorRequestRepo;
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
            queries.Query.countDoctorRequests(null, {}, context)
        ).rejects.toThrow("Unauthorized action");
    });

    it('should count doctor requests for an authorized admin user', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 1 });
        const countMock = 5;

        mockDoctorRequestRepo.getCount.mockResolvedValue(countMock);

        const result = await queries.Query.countDoctorRequests(null, {}, context);

        expect(result).toBe(countMock);
        expect(mockDoctorRequestRepo.createQueryBuilder).toHaveBeenCalledWith('doctor_request');
        expect(mockDoctorRequestRepo.getCount).toHaveBeenCalled();
    });

    it('should throw an error if an unexpected error occurs', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 1 });
        mockDoctorRequestRepo.getCount.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.countDoctorRequests(null, {}, context)
        ).rejects.toThrow("Unexpected error counting doctor requests: Error: Database error");
    });
});
