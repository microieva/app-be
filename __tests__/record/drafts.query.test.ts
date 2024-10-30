import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Record } from "../../src/graphql/record/record.model";
import { User } from "../../src/graphql/user/user.model";

describe('drafts Query Resolver', () => {
    let context: AppContext;
    let mockRecordRepo: jest.Mocked<any>;
    let mockUserRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockRecordRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            innerJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn(),
        };

        mockUserRepo = {
            findOneBy: jest.fn(),
        };

        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === Record) return mockRecordRepo;
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

    it('should throw an error for unauthorized users (non-doctor role)', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 1 });

        await expect(
            queries.Query.drafts(null, { pageIndex: 0, pageLimit: 10 }, context)
        ).rejects.toThrow("Unauthorized action");
    });

    it('should fetch draft records for a doctor with filtering and sorting', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2, id: 2 });
        const draftsMock = [{ id: 1, text: 'Draft 1' }, { id: 2, text: 'Draft 2' }];
        const countMock = 2;

        mockRecordRepo.getManyAndCount.mockResolvedValue([draftsMock, countMock]);

        const result = await queries.Query.drafts(
            null,
            {
                pageIndex: 0,
                pageLimit: 10,
                filterInput: 'patientName',
                sortActive: 'updatedAt',
                sortDirection: 'ASC',
                advancedSearchInput: {
                    rangeStart: new Date('2023-01-01'),
                    rangeEnd: new Date('2023-12-31'),
                    textLike: 'details',
                    titleLike: 'summary',
                },
            },
            context
        );

        expect(result).toEqual({
            length: countMock,
            slice: draftsMock,
        });

        expect(mockRecordRepo.createQueryBuilder).toHaveBeenCalledWith('record');
        expect(mockRecordRepo.leftJoinAndSelect).toHaveBeenCalledWith('record.appointment', 'appointment');
        expect(mockRecordRepo.innerJoin).toHaveBeenCalledWith('appointment.patient', 'patient');
        expect(mockRecordRepo.where).toHaveBeenCalledWith('appointment.doctorId = :doctorId', { doctorId: 2 });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('record.draft = :draft', { draft: true });
        expect(mockRecordRepo.orderBy).toHaveBeenCalledWith('record.updatedAt', 'ASC');
        expect(mockRecordRepo.limit).toHaveBeenCalledWith(10);
        expect(mockRecordRepo.offset).toHaveBeenCalledWith(0);
        expect(mockRecordRepo.getManyAndCount).toHaveBeenCalled();
    });

    it('should apply advanced search filters when provided', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2, id: 2 });
        const draftsMock = [{ id: 3, text: 'Draft 3' }];
        const countMock = 1;

        mockRecordRepo.getManyAndCount.mockResolvedValue([draftsMock, countMock]);

        const result = await queries.Query.drafts(
            null,
            {
                pageIndex: 0,
                pageLimit: 10,
                advancedSearchInput: {
                    rangeStart: new Date('2023-01-01'),
                    rangeEnd: new Date('2023-12-31'),
                    textLike: 'details',
                    titleLike: 'report',
                },
            },
            context
        );

        expect(result).toEqual({
            length: countMock,
            slice: draftsMock,
        });

        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('record.updatedAt >= :rangeStart', { rangeStart: new Date('2023-01-01') });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('record.updatedAt <= :rangeEnd', { rangeEnd: new Date('2023-12-31') });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('LOWER(record.text) LIKE :textLike', { textLike: '%details%' });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('LOWER(record.title) LIKE :titleLike', { titleLike: '%report%' });
        expect(mockRecordRepo.getManyAndCount).toHaveBeenCalled();
    });

    it('should fetch drafts with sorting by patient name', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2, id: 2 });
        const draftsMock = [{ id: 4, text: 'Draft 4' }, { id: 5, text: 'Draft 5' }];
        const countMock = 2;

        mockRecordRepo.getManyAndCount.mockResolvedValue([draftsMock, countMock]);

        const result = await queries.Query.drafts(
            null,
            {
                pageIndex: 0,
                pageLimit: 10,
                sortActive: 'firstName',
                sortDirection: 'DESC',
            },
            context
        );

        expect(result).toEqual({
            length: countMock,
            slice: draftsMock,
        });

        expect(mockRecordRepo.orderBy).toHaveBeenCalledWith('patient.firstName', 'DESC');
        expect(mockRecordRepo.limit).toHaveBeenCalledWith(10);
        expect(mockRecordRepo.offset).toHaveBeenCalledWith(0);
    });

    it('should throw an error if an unexpected error occurs', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockRecordRepo.getManyAndCount.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.drafts(null, { pageIndex: 0, pageLimit: 10 }, context)
        ).rejects.toThrow("Error fetching records: Error: Database error");
    });
});
