import { DataSource } from "typeorm";
import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";
import { DoctorRequest } from "../../src/graphql/doctor-request/doctor-request.model";

describe('requests Query Resolver', () => {
    let context: AppContext;
    let mockDoctorRequestRepo: jest.Mocked<any>;
    let mockUserRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                offset: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn(),
            }),
        };
        
        mockDoctorRequestRepo = {
            createQueryBuilder: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                offset: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn(),
            }),
        };

        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === User) return mockUserRepo;
                if (entity === DoctorRequest) return mockDoctorRequestRepo;
                return null;
            }),
        } as unknown as DataSource;

        context = {
            dataSource: mockDataSource,
            me: { userId: 1 }, 
        } as AppContext;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return paginated list of doctor requests if user is authorized', async () => {
        const mockRequests = [
            { id: 1, firstName: 'Alice', lastName: 'Johnson' },
            { id: 2, firstName: 'Bob', lastName: 'Smith' },
        ];
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 1 }); 
        mockDoctorRequestRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([mockRequests, 2]);

        const args = {
            pageIndex: 0,
            pageLimit: 2,
            sortActive: 'firstName',
            sortDirection: 'ASC',
            filterInput: '',
        };
        
        const result = await queries.Query.requests(null, args, context);

        expect(result).toEqual({
            slice: mockRequests,
            length: 2,
        });
        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockDoctorRequestRepo.createQueryBuilder).toHaveBeenCalled();
        expect(mockDoctorRequestRepo.createQueryBuilder().orderBy).toHaveBeenCalledWith('doctor_request.firstName', 'ASC');
    });

    it('should apply filter when filterInput is provided', async () => {
        const mockRequests = [
            { id: 1, firstName: 'Alice', lastName: 'Johnson' },
        ];
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 1 }); 
        mockDoctorRequestRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([mockRequests, 1]);

        const args = {
            pageIndex: 0,
            pageLimit: 1,
            sortActive: 'lastName',
            sortDirection: 'DESC',
            filterInput: 'johnson',
        };

        const result = await queries.Query.requests(null, args, context);

        expect(result).toEqual({
            slice: mockRequests,
            length: 1,
        });
        expect(mockDoctorRequestRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith(
            '(LOWER(doctor_request.firstName) LIKE :nameLike OR LOWER(doctor_request.lastName) LIKE :nameLike)',
            { nameLike: '%johnson%' }
        );
    });

    it('should throw an error if user is not authorized', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 2 }); 

        await expect(
            queries.Query.requests(null, {}, context)
        ).rejects.toThrow("Unauthorized action");

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockDoctorRequestRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should handle database errors and throw appropriate error message', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 1 }); 
        mockDoctorRequestRepo.createQueryBuilder().getManyAndCount.mockRejectedValue(new Error('Database error'));

        const args = {
            pageIndex: 0,
            pageLimit: 2,
            sortActive: 'firstName',
            sortDirection: 'ASC',
            filterInput: '',
        };

        await expect(
            queries.Query.requests(null, args, context)
        ).rejects.toThrow("Error fetching doctor account requests: Error: Database error");

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockDoctorRequestRepo.createQueryBuilder).toHaveBeenCalled();
    });
});
