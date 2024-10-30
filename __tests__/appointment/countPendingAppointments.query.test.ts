import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { User } from "../../src/graphql/user/user.model";


describe('countPendingAppointments Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn()
        };
        mockAppointmentRepo = {
            createQueryBuilder: jest.fn()
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

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should throw an error if user is unauthorized (no user or admin)', async () => {
        mockUserRepo.findOneBy.mockReturnValue(null);

        await expect(queries.Query.countPendingAppointments(null, {}, context)).rejects
            .toThrow('Unauthorized action');

        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 1});
        await expect(queries.Query.countPendingAppointments(null, {}, context)).rejects
            .toThrow('Unauthorized action');
    });

    it('should count pending appointments for a patient', async () => {
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 3});
        mockAppointmentRepo.createQueryBuilder.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn().mockResolvedValue(5),
        });

        const result = await queries.Query.countPendingAppointments(null, {}, context);

        expect(result).toBe(5);
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
    });

    it('should count pending appointments for a doctor', async () => {
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 2});

        mockAppointmentRepo.createQueryBuilder.mockReturnValueOnce({
            createQueryBuilder: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([{ appointment_start: new Date() }]),
        });

        mockAppointmentRepo.createQueryBuilder.mockReturnValueOnce({
            createQueryBuilder: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getCount: jest.fn().mockResolvedValue(3),
        });

        const result = await queries.Query.countPendingAppointments(null, {}, context);

        expect(result).toBe(3);
    });

    it('should handle no reserved times for a doctor', async () => {
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 2});

        mockAppointmentRepo.createQueryBuilder.mockReturnValueOnce({
            createQueryBuilder: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([]), 
        });

        mockAppointmentRepo.createQueryBuilder.mockReturnValueOnce({
            createQueryBuilder: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            getCount: jest.fn().mockResolvedValue(2),
        });

        const result = await queries.Query.countPendingAppointments(null, {}, context);

        expect(result).toBe(2);
    });

    it('should throw an error if an unexpected error occurs', async () => {
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 2});
        mockAppointmentRepo.createQueryBuilder.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockReturnThis(),
            getCount: jest.fn().mockRejectedValue(new Error('Database error')),
        });

        await expect(queries.Query.countPendingAppointments(null, {}, context)).rejects
            .toThrow('Database error');
    });
});
