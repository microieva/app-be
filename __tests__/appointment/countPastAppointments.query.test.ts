import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { User } from "../../src/graphql/user/user.model";

describe('countPastAppointments Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn()
        };
        mockAppointmentRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn()
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

    it('should throw an error if user is unauthorized (no user or admin)', async () => {
        mockUserRepo.findOneBy.mockReturnValue(null);

        await expect(queries.Query.countPastAppointments(null, {}, context)).rejects.toThrow('Unauthorized action');

        mockUserRepo.findOneBy.mockReturnValue({ id: 1, userRoleId: 1 });
        await expect(queries.Query.countPastAppointments(null, {}, context)).rejects.toThrow('Unauthorized action');
    });

    it('should count past appointments for a patient', async () => {
        mockUserRepo.findOneBy.mockReturnValue({ id: 1, userRoleId: 3 });
        mockAppointmentRepo.getCount.mockResolvedValue(5);

        const result = await queries.Query.countPastAppointments(null, {}, context);

        expect(result).toBe(5);
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockAppointmentRepo.where).toHaveBeenCalledWith('appointment.patientId = :patientId', { patientId: context.me.userId });
        expect(mockAppointmentRepo.andWhere).toHaveBeenCalledWith('appointment.doctorId IS NOT NULL');
        expect(mockAppointmentRepo.andWhere).toHaveBeenCalledWith('appointment.end < :now', { now: expect.any(Date) });
    });

    it('should count past appointments for a doctor', async () => {
        mockUserRepo.findOneBy.mockReturnValue({ id: 1, userRoleId: 2 });
        mockAppointmentRepo.getCount.mockResolvedValue(8);

        const result = await queries.Query.countPastAppointments(null, {}, context);

        expect(result).toBe(8);
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockAppointmentRepo.where).toHaveBeenCalledWith('appointment.doctorId = :doctorId', { doctorId: context.me.userId });
        expect(mockAppointmentRepo.andWhere).toHaveBeenCalledWith('appointment.patientId IS NOT NULL');
        expect(mockAppointmentRepo.andWhere).toHaveBeenCalledWith('appointment.end < :now', { now: expect.any(Date) });
    });

    it('should throw an error if an unexpected error occurs', async () => {
        mockUserRepo.findOneBy.mockReturnValue({ id: 1, userRoleId: 2 });
        mockAppointmentRepo.getCount.mockRejectedValue(new Error('Database error'));

        await expect(queries.Query.countPastAppointments(null, {}, context)).rejects
            .toThrow('Unexpected error when counting past appointments: Error: Database error');
    });
});
