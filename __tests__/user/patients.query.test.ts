import { DataSource } from "typeorm";
import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";

describe('patients Query Resolver', () => {
    let context: AppContext;
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
        
        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === User) return mockUserRepo;
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

    it('should return paginated list of patients if user is authorized', async () => {
        const mockPatients = [
            { id: 1, firstName: 'Alice', lastName: 'Johnson', userRoleId: 3 },
            { id: 2, firstName: 'Bob', lastName: 'Smith', userRoleId: 3 },
        ];
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 1 }); 
        mockUserRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([mockPatients, 2]);

        const args = {
            pageIndex: 0,
            pageLimit: 2,
            sortActive: 'firstName',
            sortDirection: 'ASC',
            filterInput: '',
        };
        
        const result = await queries.Query.patients(null, args, context);

        expect(result).toEqual({
            slice: mockPatients,
            length: 2,
        });
        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockUserRepo.createQueryBuilder().where).toHaveBeenCalledWith('user.userRoleId = :userRoleId', { userRoleId: 3 });
        expect(mockUserRepo.createQueryBuilder().orderBy).toHaveBeenCalledWith('user.firstName', 'ASC');
    });

    it('should apply filter when filterInput is provided', async () => {
        const mockPatients = [
            { id: 1, firstName: 'Alice', lastName: 'Johnson', userRoleId: 3 },
        ];
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 1 }); 
        mockUserRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([mockPatients, 1]);

        const args = {
            pageIndex: 0,
            pageLimit: 1,
            sortActive: 'lastName',
            sortDirection: 'DESC',
            filterInput: 'johnson',
        };

        const result = await queries.Query.patients(null, args, context);

        expect(result).toEqual({
            slice: mockPatients,
            length: 1,
        });
        expect(mockUserRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith(
            '(LOWER(user.firstName) LIKE :nameLike OR LOWER(user.lastName) LIKE :nameLike)',
            { nameLike: '%johnson%' }
        );
    });

    it('should throw an error if user is not authorized', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 2 }); 

        await expect(
            queries.Query.patients(null, {}, context)
        ).rejects.toThrow("Unauthorized action");

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockUserRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should handle database errors and throw appropriate error message', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 1 }); 
        mockUserRepo.createQueryBuilder().getManyAndCount.mockRejectedValue(new Error('Database error'));

        const args = {
            pageIndex: 0,
            pageLimit: 2,
            sortActive: 'firstName',
            sortDirection: 'ASC',
            filterInput: '',
        };

        await expect(
            queries.Query.patients(null, args, context)
        ).rejects.toThrow("Error fetching patients: Error: Database error");

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockUserRepo.createQueryBuilder).toHaveBeenCalled();
    });
});
