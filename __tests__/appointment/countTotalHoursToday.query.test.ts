import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { User } from "../../src/graphql/user/user.model";

describe('countTotalHoursToday Query Resolver', () => {
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
            select: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
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

    it('should calculate total hours for today\'s appointments correctly', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockAppointmentRepo.getMany.mockResolvedValue([
            { start: new Date('2024-10-30T09:00:00Z'), end: new Date('2024-10-30T10:00:00Z') },
            { start: new Date('2024-10-30T11:00:00Z'), end: new Date('2024-10-30T12:30:00Z') },
        ]);

        const result = await queries.Query.countTotalHoursToday(null, {}, context);

        expect(result).toBe('2 h 30 min');
    });

    it('should return "-" if there are no appointments for today', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockAppointmentRepo.getMany.mockResolvedValue([]);

        const result = await queries.Query.countTotalHoursToday(null, {}, context);

        expect(result).toBe('-');
    });

    it('should throw an error for unauthorized access', async () => {
        //context.me.userRoleId = 1; 
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 1 });

        await expect(
            queries.Query.countTotalHoursToday(null, {}, context)
        ).rejects.toThrow("Unauthorized action");
    });

    it('should throw an error if user is not found', async () => {
        mockUserRepo.findOneBy.mockResolvedValue(null); 

        await expect(
            queries.Query.countTotalHoursToday(null, {}, context)
        ).rejects.toThrow("Unauthorized action");
    });

    it('should throw an error if fetching appointments fails', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockAppointmentRepo.getMany.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.countTotalHoursToday(null, {}, context)
        ).rejects.toThrow('Error fetching total appointment time for today: Error: Database error');
    });
});
