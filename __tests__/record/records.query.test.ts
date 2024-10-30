import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Record } from "../../src/graphql/record/record.model";
import { User } from "../../src/graphql/user/user.model";

describe('records Query Resolver', () => {
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

    it('should throw an error for unauthorized users (role 1)', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 1 });

        await expect(
            queries.Query.records(null, { pageIndex: 0, pageLimit: 10 }, context)
        ).rejects.toThrow("Unauthorized action");
    });

    it('should fetch records for a patient (role 3) with filtering and sorting', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 3, id: 1 });
        const recordsMock = [{ id: 1, text: 'Record 1' }, { id: 2, text: 'Record 2' }];
        const countMock = 2;

        mockRecordRepo.getManyAndCount.mockResolvedValue([recordsMock, countMock]);

        const result = await queries.Query.records(
            null,
            {
                pageIndex: 0,
                pageLimit: 10,
                filterInput: 'doctorName',
                sortActive: 'createdAt',
                sortDirection: 'ASC',
                advancedSearchInput: {
                    rangeStart: new Date('2023-01-01'),
                    rangeEnd: new Date('2023-12-31'),
                    textLike: 'summary',
                    titleLike: 'condition',
                },
            },
            context
        );

        expect(result).toEqual({
            length: countMock,
            slice: recordsMock,
        });

        expect(mockRecordRepo.createQueryBuilder).toHaveBeenCalledWith('record');
        expect(mockRecordRepo.leftJoinAndSelect).toHaveBeenCalledWith('record.appointment', 'appointment');
        expect(mockRecordRepo.innerJoin).toHaveBeenCalledWith('appointment.doctor', 'doctor');
        expect(mockRecordRepo.where).toHaveBeenCalledWith('appointment.patientId = :patientId', { patientId: 1 });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('record.draft = :draft', { draft: false });
        expect(mockRecordRepo.orderBy).toHaveBeenCalledWith('record.createdAt', 'ASC');
        expect(mockRecordRepo.limit).toHaveBeenCalledWith(10);
        expect(mockRecordRepo.offset).toHaveBeenCalledWith(0);
        expect(mockRecordRepo.getManyAndCount).toHaveBeenCalled();
    });

    it('should fetch records for a doctor (other role) with filtering and sorting', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2, id: 2 });
        const recordsMock = [{ id: 3, text: 'Record 3' }, { id: 4, text: 'Record 4' }];
        const countMock = 2;

        mockRecordRepo.getManyAndCount.mockResolvedValue([recordsMock, countMock]);

        const result = await queries.Query.records(
            null,
            {
                pageIndex: 1,
                pageLimit: 5,
                filterInput: 'patientName',
                sortActive: 'updatedAt',
                sortDirection: 'DESC',
                advancedSearchInput: null,
            },
            context
        );

        expect(result).toEqual({
            length: countMock,
            slice: recordsMock,
        });

        expect(mockRecordRepo.createQueryBuilder).toHaveBeenCalledWith('record');
        expect(mockRecordRepo.leftJoinAndSelect).toHaveBeenCalledWith('record.appointment', 'appointment');
        expect(mockRecordRepo.innerJoin).toHaveBeenCalledWith('appointment.patient', 'patient');
        expect(mockRecordRepo.where).toHaveBeenCalledWith('appointment.doctorId = :doctorId', { doctorId: 2 });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('record.draft = :draft', { draft: false });
        expect(mockRecordRepo.orderBy).toHaveBeenCalledWith('record.updatedAt', 'DESC');
        expect(mockRecordRepo.limit).toHaveBeenCalledWith(5);
        expect(mockRecordRepo.offset).toHaveBeenCalledWith(5); // second page, so offset should be pageIndex * pageLimit
        expect(mockRecordRepo.getManyAndCount).toHaveBeenCalled();
    });

    it('should apply advanced search filters when provided', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 3, id: 1 });
        const recordsMock = [{ id: 5, text: 'Record 5' }];
        const countMock = 1;

        mockRecordRepo.getManyAndCount.mockResolvedValue([recordsMock, countMock]);

        const result = await queries.Query.records(
            null,
            {
                pageIndex: 0,
                pageLimit: 10,
                advancedSearchInput: {
                    rangeStart: new Date('2023-01-01'),
                    rangeEnd: new Date('2023-12-31'),
                    textLike: 'symptoms',
                    titleLike: 'diagnosis',
                },
            },
            context
        );

        expect(result).toEqual({
            length: countMock,
            slice: recordsMock,
        });

        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('record.updatedAt >= :rangeStart', { rangeStart: new Date('2023-01-01') });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('record.updatedAt <= :rangeEnd', { rangeEnd: new Date('2023-12-31') });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('LOWER(record.text) LIKE :textLike', { textLike: '%symptoms%' });
        expect(mockRecordRepo.andWhere).toHaveBeenCalledWith('LOWER(record.title) LIKE :titleLike', { titleLike: '%diagnosis%' });
        expect(mockRecordRepo.getManyAndCount).toHaveBeenCalled();
    });

    it('should throw an error if an unexpected error occurs', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockRecordRepo.getManyAndCount.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.records(null, { pageIndex: 0, pageLimit: 10 }, context)
        ).rejects.toThrow("Error fetching records: Error: Database error");
    });
});
