import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { User } from "../../src/graphql/user/user.model";

describe('pendingAppointments Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;
    let mockUser: any;

    beforeAll(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
        };

        mockAppointmentRepo = {
            createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
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

        mockUser = { userId: 1, userRoleId: 1 }; 

        context = {
            dataSource: mockDataSource,
            me: { userId: 1},
        } as AppContext;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return pending appointments for a patient', async () => {
        const mockAppointments = [
            { id: 1, start: new Date(Date.now() + 200000), patientId: 1, doctorId: null }, 
            { id: 2, start: new Date(Date.now() + 400000), patientId: 1, doctorId: null },
        ];
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 3})
        mockAppointmentRepo.createQueryBuilder.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([mockAppointments, mockAppointments.length]),
        });

        const result = await queries.Query.pendingAppointments(null, { pageIndex: 0, pageLimit: 10, sortActive: 'start', sortDirection: 'ASC', filterInput: '' }, context);

        expect(result.slice).toEqual(mockAppointments);
        expect(result.length).toBe(mockAppointments.length);
    });

    it('should return pending appointments for a doctor', async () => {
        mockUser.userRoleId = 2; 
        mockUser.userId = 1;
        const mockAppointments = [
            { id: 1, end: new Date(Date.now() + 200000), patientId: 1, doctorId: null }, 
            { id: 2, end: new Date(Date.now() + 400000), patientId: 1, doctorId: null },
        ];

        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 2})
        mockAppointmentRepo.createQueryBuilder.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([mockAppointments, mockAppointments.length]),
        });
        const args = { pageIndex: 0, pageLimit: 10, sortActive: 'start', sortDirection: 'ASC', filterInput: null };
        const result = await queries.Query.pendingAppointments(null, args, context);

        expect(result).toEqual({ length: mockAppointments.length, slice: mockAppointments });
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockAppointmentRepo.createQueryBuilder().where).toHaveBeenCalledWith('appointment.doctorId IS NULL');
        expect(mockAppointmentRepo.createQueryBuilder().andWhere).toHaveBeenCalledWith('appointment.end > :now', { now: expect.any(Date) });
    });

    it('should throw an error if user is not authenticated', async () => {
        mockUserRepo.findOneBy.mockResolvedValue(null);

        await expect(
            queries.Query.pendingAppointments(null, {}, context)
        ).rejects.toThrow('Authenticate yourself');
    });

    it('should throw an error when fetching pending appointments fails for patient', async () => {
        mockUser.userRoleId = 3; 
        context.me.userId = 1;
        const errorMessage = 'Database error';
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 3 });
        mockAppointmentRepo.createQueryBuilder().getManyAndCount.mockRejectedValue(new Error(errorMessage));

        const args = { pageIndex: 0, pageLimit: 10, sortActive: 'start', sortDirection: 'ASC', filterInput: null };

        await expect(
            queries.Query.pendingAppointments(null, args, context)
        ).rejects.toThrow(`Error fetching pending appointments: Error: ${errorMessage}`);
    });

    it('should throw an error when fetching pending appointments fails for doctor', async () => {
        mockUser.userRoleId = 2; 
        mockUser.userId = 1;
        const errorMessage = 'Database error';
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 2 });
        mockAppointmentRepo.createQueryBuilder().getManyAndCount.mockRejectedValue(new Error(errorMessage));
        const args = { pageIndex: 0, pageLimit: 10, sortActive: 'start', sortDirection: 'ASC', filterInput: null };

        await expect(
            queries.Query.pendingAppointments(null, args, context)
        ).rejects.toThrow(`Error fetching pending appointments: Error: ${errorMessage}`);
    });
});
