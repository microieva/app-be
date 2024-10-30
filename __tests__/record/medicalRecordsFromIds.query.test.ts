import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Record } from "../../src/graphql/record/record.model";
import { User } from "../../src/graphql/user/user.model";

describe('medicalRecordsFromIds Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockRecordRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
        };

        mockRecordRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            innerJoin: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn(),
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
            me: { userId: 2, userRoleId: 2 },
        } as AppContext;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch medical records for valid user roles', async () => {
        const ids = [1, 2, 3];
        const mockRecords = [{ id: 1 }, { id: 2 }];
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockRecordRepo.getManyAndCount.mockResolvedValue([mockRecords, mockRecords.length]);

        const result = await queries.Query.medicalRecordsFromIds(null, { ids, pageIndex: 0, pageLimit: 10 }, context);

        expect(result.length).toBe(mockRecords.length);
        expect(result.slice).toEqual(mockRecords);
        expect(mockRecordRepo.getManyAndCount).toHaveBeenCalled();
    });

    it('should throw an error for unauthorized access', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 1 }); 
        const ids = [1, 2, 3];

        await expect(
            queries.Query.medicalRecordsFromIds(null, { ids, pageIndex: 0, pageLimit: 10 }, context)
        ).rejects.toThrow("Unauthorized action");
    });

    it('should apply filtering based on filterInput', async () => {
        const ids = [1, 2, 3];
        const filterInput = 'test';
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockRecordRepo.getManyAndCount.mockResolvedValue([[], 0]);

        await queries.Query.medicalRecordsFromIds(null, { ids, pageIndex: 0, pageLimit: 10, filterInput }, context);

        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith(
            '(LOWER(doctor.firstName) LIKE :nameLike OR LOWER(doctor.lastName) LIKE :nameLike)',
            { nameLike: `%${filterInput}%` }
        );
    });

    it('should apply advanced search criteria if provided', async () => {
        const ids = [1, 2, 3];
        const advancedSearchInput = {
            rangeStart: new Date(),
            rangeEnd: new Date(),
            textLike: 'sample',
            titleLike: 'title',
        };
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockRecordRepo.getManyAndCount.mockResolvedValue([[], 0]);

        await queries.Query.medicalRecordsFromIds(null, { ids, pageIndex: 0, pageLimit: 10, advancedSearchInput }, context);

        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('record.updatedAt >= :rangeStart', { rangeStart: advancedSearchInput.rangeStart });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('record.updatedAt <= :rangeEnd', { rangeEnd: advancedSearchInput.rangeEnd });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('LOWER(record.text) LIKE :textLike', { textLike: `%${advancedSearchInput.textLike.toLowerCase()}%` });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('LOWER(record.title) LIKE :titleLike', { titleLike: `%${advancedSearchInput.titleLike.toLowerCase()}%` });
    });

    it('should throw an error if fetching records fails', async () => {
        const ids = [1, 2, 3];
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockRecordRepo.getManyAndCount.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.medicalRecordsFromIds(null, { ids, pageIndex: 0, pageLimit: 10 }, context)
        ).rejects.toThrow('Unable to fetch records Error: Database error');
    });
});
