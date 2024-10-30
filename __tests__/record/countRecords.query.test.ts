import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";
import { Record } from "../../src/graphql/record/record.model";

describe('countRecords Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockRecordRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn(),
        };

        mockRecordRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn(),
        };

        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === User) return mockUserRepo;
                if (entity === Record) return mockRecordRepo;
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

    it('should throw an error for unauthorized users', async () => {
        mockUserRepo.findOneBy.mockResolvedValue(null);

        await expect(
            queries.Query.countRecords(null, {}, context)
        ).rejects.toThrow('Unauthorized action');
    });

    it('should throw an error for users with roleId 1', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 1 });

        await expect(
            queries.Query.countRecords(null, {}, context)
        ).rejects.toThrow('Unauthorized action');
    });

    it('should count records for patients', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 3 });
        const recordCount = 5;

        mockRecordRepo.getCount.mockResolvedValue(recordCount);

        const result = await queries.Query.countRecords(null, {}, context);

        expect(result).toBe(recordCount);
        expect(mockRecordRepo.createQueryBuilder).toHaveBeenCalledWith('record');
        expect(mockRecordRepo.where).toHaveBeenCalledWith('record.draft = :draft', { draft: false });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('record.patientId = :patientId', { patientId: context.me.userId });
        expect(mockRecordRepo.getCount).toHaveBeenCalled();
    });

    it('should count records for doctors', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        const recordCount = 7;

        mockRecordRepo.getCount.mockResolvedValue(recordCount);

        const result = await queries.Query.countRecords(null, {}, context);

        expect(result).toBe(recordCount);
        expect(mockRecordRepo.createQueryBuilder).toHaveBeenCalledWith('record');
        expect(mockRecordRepo.where).toHaveBeenCalledWith('record.draft = :draft', { draft: false });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('record.doctorId = :doctorId', { doctorId: context.me.userId });
        expect(mockRecordRepo.getCount).toHaveBeenCalled();
    });

    it('should throw an error if an unexpected error occurs', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 3 });
        mockRecordRepo.getCount.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.countRecords(null, {}, context)
        ).rejects.toThrow('Error counting medical records, Error: Database error');
    });
});
