import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { User } from "../../src/graphql/user/user.model";

describe('countTodayAppointments Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
        };

        mockAppointmentRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn(),
        };

        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === User) return mockUserRepo;
                if (entity === Appointment) return mockAppointmentRepo;
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

    it('should count today\'s appointments for valid user roles', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockAppointmentRepo.getCount.mockResolvedValue(5);

        const result = await queries.Query.countTodayAppointments(null, {}, context);

        expect(result).toBe(5);
        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
        expect(mockAppointmentRepo.getCount).toHaveBeenCalled();
    });

    it('should throw an error for unauthorized access', async () => {
        context.me.userRoleId = 1; // Set userRoleId to 1 for unauthorized access
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 1 });

        await expect(
            queries.Query.countTodayAppointments(null, {}, context)
        ).rejects.toThrow("Unauthorized action");
    });

    it('should throw an error if user is not found', async () => {
        mockUserRepo.findOneBy.mockResolvedValue(null); // Simulate user not found

        await expect(
            queries.Query.countTodayAppointments(null, {}, context)
        ).rejects.toThrow("Unauthorized action");
    });

    it('should count appointments correctly within today\'s date range', async () => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockAppointmentRepo.getCount.mockResolvedValue(3);

        await queries.Query.countTodayAppointments(null, {}, context);

        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockAppointmentRepo.where).toHaveBeenCalledWith('appointment.doctorId = :doctorId', { doctorId: context.me.userId });
        expect(mockAppointmentRepo.where).toHaveBeenCalledWith('appointment.start >= :startOfDay', { startOfDay });
        expect(mockAppointmentRepo.andWhere).toHaveBeenCalledWith('appointment.start <= :endOfDay', { endOfDay });
    });

    it('should throw an error if fetching counts fails', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockAppointmentRepo.getCount.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.countTodayAppointments(null, {}, context)
        ).rejects.toThrow('Error fetching today\'s appointments: Error: Database error');
    });
});
