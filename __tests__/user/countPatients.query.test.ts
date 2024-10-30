import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";
import { Appointment } from "../../src/graphql/appointment/appointment.model";

describe('countPatients Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getCount: jest.fn(),
        };

        mockAppointmentRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getRawOne: jest.fn(),
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

    it('should throw an error for unauthorized users (role patient)', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 3 });

        await expect(
            queries.Query.countPatients(null, {}, context)
        ).rejects.toThrow("Unauthorized action");
    });

    it('should count patients for an authorized admin user', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 1 });
        const patientCount = 5;

        mockUserRepo.getCount.mockResolvedValue(patientCount);

        const result = await queries.Query.countPatients(null, {}, context);

        expect(result).toBe(patientCount);
        expect(mockUserRepo.createQueryBuilder).toHaveBeenCalledWith('user');
        expect(mockUserRepo.where).toHaveBeenCalledWith('user.userRoleId = :id', { id: 3 });
        expect(mockUserRepo.getCount).toHaveBeenCalled();
    });

    it('should count patients for an authorized doctor user', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        const patientCount = { count: 7 };

        mockAppointmentRepo.getRawOne.mockResolvedValue(patientCount);

        const result = await queries.Query.countPatients(null, {}, context);

        expect(result).toBe(patientCount.count);
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockAppointmentRepo.select).toHaveBeenCalledWith('COUNT(DISTINCT appointment.patientId)', 'count');
        expect(mockAppointmentRepo.where).toHaveBeenCalledWith('appointment.doctorId = :id', { id: context.me.userId });
        expect(mockAppointmentRepo.getRawOne).toHaveBeenCalled();
    });

    it('should throw an error if an unexpected error occurs', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 1 });
        mockUserRepo.getCount.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.countPatients(null, {}, context)
        ).rejects.toThrow("Unexpected error counting patients: Error: Database error");
    });
});
