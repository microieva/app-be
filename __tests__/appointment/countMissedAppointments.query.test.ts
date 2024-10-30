import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { getNow } from "../../src/graphql/utils"; 

describe('countMissedAppointments Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn(),
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
            me: { userId: 1 },
        } as AppContext;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should throw an error for unauthorized users', async () => {
        mockUserRepo.findOneBy.mockResolvedValue(null);

        await expect(
            queries.Query.countMissedAppointments(null, {}, context)
        ).rejects.toThrow("Unauthorized action");
    });

    it('should count missed appointments for users who are not patients', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        const now = getNow();
        const missedCount = 3;

        mockAppointmentRepo.getCount.mockResolvedValue(missedCount);

        const result = await queries.Query.countMissedAppointments(null, {}, context);

        expect(result).toBe(missedCount);
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockAppointmentRepo.where).toHaveBeenCalledWith('appointment.patientId IS NOT NULL');
        expect(mockAppointmentRepo.andWhere).toHaveBeenCalledWith('appointment.doctorId IS NULL');
        expect(mockAppointmentRepo.andWhere).toHaveBeenCalledWith('appointment.start < :now', { now });
        expect(mockAppointmentRepo.getCount).toHaveBeenCalled();
    });

    it('should count missed appointments for a patient', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 3 });
        const now = getNow();
        const missedCount = 2;

        mockAppointmentRepo.getCount.mockResolvedValue(missedCount);

        const result = await queries.Query.countMissedAppointments(null, {}, context);

        expect(result).toBe(missedCount);
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockAppointmentRepo.where).toHaveBeenCalledWith('appointment.patientId = :id', { id: context.me.userId });
        expect(mockAppointmentRepo.andWhere).toHaveBeenCalledWith('appointment.doctorId IS NULL');
        expect(mockAppointmentRepo.andWhere).toHaveBeenCalledWith('appointment.start < :now', { now });
        expect(mockAppointmentRepo.getCount).toHaveBeenCalled();
    });

    it('should throw an error if an unexpected error occurs', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockAppointmentRepo.getCount.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.countMissedAppointments(null, {}, context)
        ).rejects.toThrow("Error counting missed appointments: Error: Database error");
    });
});
