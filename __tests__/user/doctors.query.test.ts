import { DataSource } from "typeorm";
import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";


describe('doctors Query Resolver', () => {
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

    it('should return paginated list of doctors if user is authorized', async () => {
        const mockDoctors = [
            { id: 1, firstName: 'John', lastName: 'Doe', userRoleId: 2 },
            { id: 2, firstName: 'Jane', lastName: 'Smith', userRoleId: 2 },
        ];
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 1 }); 
        mockUserRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([mockDoctors, 2]);

        const args = {
            pageIndex: 0,
            pageLimit: 2,
            sortActive: 'firstName',
            sortDirection: 'ASC',
            filterInput: '',
        };
        
        const result = await queries.Query.doctors(null, args, context);

        expect(result).toEqual({
            slice: mockDoctors,
            length: 2,
        });
        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockUserRepo.createQueryBuilder().where).toHaveBeenCalledWith('user.userRoleId = :userRoleId', { userRoleId: 2 });
        expect(mockUserRepo.createQueryBuilder().orderBy).toHaveBeenCalledWith('user.firstName', 'ASC');
    });

    it('should apply filter when filterInput is provided', async () => {
        const mockDoctors = [
            { id: 1, firstName: 'John', lastName: 'Doe', userRoleId: 2 },
        ];
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 1 }); 
        mockUserRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([mockDoctors, 1]);

        const args = {
            pageIndex: 0,
            pageLimit: 1,
            sortActive: 'lastName',
            sortDirection: 'DESC',
            filterInput: 'doe',
        };

        const result = await queries.Query.doctors(null, args, context);

        expect(result).toEqual({
            slice: mockDoctors,
            length: 1,
        });
        expect(mockUserRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith(
            '(LOWER(user.firstName) LIKE :nameLike OR LOWER(user.lastName) LIKE :nameLike)',
            { nameLike: '%doe%' }
        );
    });

    it('should throw an error if user is not authorized', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 2 }); 

        await expect(
            queries.Query.doctors(null, {}, context)
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
            queries.Query.doctors(null, args, context)
        ).rejects.toThrow("Error fetching doctors: Error: Database error");

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockUserRepo.createQueryBuilder).toHaveBeenCalled();
    });
});
