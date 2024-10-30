import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { User } from "../../src/graphql/user/user.model";

describe('countUpcomingAppointments Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
        };
        
        const mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn(),
        };

        mockAppointmentRepo = {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
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
        mockUserRepo.findOneBy.mockResolvedValue(null);

        await expect(queries.Query.countUpcomingAppointments(null, {}, context)).rejects.toThrow('Unauthorized action');

        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 1 });
        await expect(queries.Query.countUpcomingAppointments(null, {}, context)).rejects.toThrow('Unauthorized action');
    });

    it('should count upcoming appointments for a patient', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 3 });
        mockAppointmentRepo.createQueryBuilder().getCount.mockResolvedValue(4); 

        const result = await queries.Query.countUpcomingAppointments(null, {}, context);

        expect(result).toBe(4);
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockAppointmentRepo.createQueryBuilder().where).toHaveBeenCalledWith('appointment.patientId = :patientId', { patientId: context.me.userId });
        expect(mockAppointmentRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('appointment.doctorId IS NOT NULL');
        expect(mockAppointmentRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('appointment.start > :now', { now: expect.any(Date)});
    });

    it('should count upcoming appointments for a doctor', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 2 });
        mockAppointmentRepo.createQueryBuilder().getCount.mockResolvedValue(7);  

        const result = await queries.Query.countUpcomingAppointments(null, {}, context);

        expect(result).toBe(7);
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockAppointmentRepo.createQueryBuilder().where).toHaveBeenCalledWith('appointment.doctorId = :doctorId', { doctorId: context.me.userId });
        expect(mockAppointmentRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('appointment.patientId IS NOT NULL');
        expect(mockAppointmentRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('appointment.start > :now', { now: expect.any(Date) });
    });

    it('should throw an error if an unexpected error occurs', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 2 });
        mockAppointmentRepo.createQueryBuilder().getCount.mockRejectedValue(new Error('Database error'));

        await expect(queries.Query.countUpcomingAppointments(null, {}, context)).rejects.toThrow('Database error');
    });
});
