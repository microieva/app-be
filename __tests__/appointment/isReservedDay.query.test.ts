import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { User } from "../../src/graphql/user/user.model";

describe('isReservedDay Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
        };
        mockAppointmentRepo = {
            createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                offset: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockReturnThis(),
            })),
        };

        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === User) return mockUserRepo;
                if (entity === Appointment) return mockAppointmentRepo;
                return null;
            }),
        } ;

        context = {
            dataSource: mockDataSource,
            me: { userId: 1},
        } as AppContext;
    });

    it('should return true if the user is not a doctor', async () => {
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 1});

        const result = await queries.Query.isReservedDay(null, { date: new Date() }, context);
        
        expect(result).toBe(true);
    });

    it('should return if the doctor has a reserved day', async () => {
        const mockDate = new Date();
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 2});
        mockAppointmentRepo.createQueryBuilder.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getExists: jest.fn().mockResolvedValue(true), 
        });

        const result = await queries.Query.isReservedDay(null, { date: mockDate }, context);

        expect(result).toBe(true);
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
    });

    it('should return false if the doctor does not have a reserved day', async () => {
        const mockDate = new Date();
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 2});
        mockAppointmentRepo.createQueryBuilder.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getExists: jest.fn().mockResolvedValue(false), 
        });

        const result = await queries.Query.isReservedDay(null, { date: mockDate }, context);

        expect(result).toBe(false);
    });

    it('should throw an error if there is an unexpected error', async () => {
        const mockDate = new Date();
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 2});
        mockAppointmentRepo.createQueryBuilder.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getExists: jest.fn().mockRejectedValue(new Error('Database error')), 
        });

        await expect(queries.Query.isReservedDay(null, { date: mockDate }, context))
            .rejects
            .toThrow('Database error');
    });
});
