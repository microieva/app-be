import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { User } from "../../src/graphql/user/user.model";

describe('calendarMissedAppointments Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;

    beforeAll(() => {
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

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return missed appointments for a patient', async () => {
        const mockAppointments = [
            { id: 1, start: new Date(Date.now() - 100000), end: new Date(Date.now() - 50000), patientId: 1 },
            { id: 2, start: new Date(Date.now() - 200000), end: new Date(Date.now() - 150000), patientId: 1 },
        ];
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 3});
        mockAppointmentRepo.createQueryBuilder.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(mockAppointments),
        });

        const result = await queries.Query.calendarMissedAppointments(null, { monthStart: new Date(Date.now() - 300000), monthEnd: new Date(), patientId: 1 }, context);

        expect(result.monthSlice).toEqual(mockAppointments);
    });

    it('should return missed appointments for a doctor', async () => {
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 2})
        const reservedTimes = [{ appointment_start: new Date(Date.now() - 200000) }];
        const mockAppointments = [
            { id: 3, start: new Date(Date.now() - 300000), end: new Date(Date.now() - 200000), doctorId: 1 },
            { id: 4, start: new Date(Date.now() - 400000), end: new Date(Date.now() - 350000), doctorId: 1 },
        ];

        mockAppointmentRepo.createQueryBuilder.mockReturnValueOnce({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue(reservedTimes),
        }).mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(mockAppointments),
        });

        const result = await queries.Query.calendarMissedAppointments(null, { monthStart: new Date(Date.now() - 500000), monthEnd: new Date(), patientId: 1 }, context);

        expect(result.monthSlice).toEqual(mockAppointments);
    });

    it('should return missed appointments for an admin', async () => {
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 1})
        const mockAppointments = [
            { id: 5, start: new Date(Date.now() - 600000), end: new Date(Date.now() - 550000), patientId: 2 },
            { id: 6, start: new Date(Date.now() - 700000), end: new Date(Date.now() - 650000), patientId: 2 },
        ];

        mockAppointmentRepo.createQueryBuilder.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(mockAppointments),
        });

        const result = await queries.Query.calendarMissedAppointments(null, { monthStart: new Date(Date.now() - 800000), monthEnd: new Date(), patientId: 2 }, context);

        expect(result.monthSlice).toEqual(mockAppointments);
    });

    it('should throw an error if user is not authenticated', async () => {
        mockUserRepo.findOneBy.mockReturnValue(null);

        await expect(queries.Query.calendarMissedAppointments(null, { monthStart: new Date(), monthEnd: new Date(), patientId: 1 }, context))
            .rejects
            .toThrow('Unauthorized action');
    });

    it('should handle errors when fetching missed appointments', async () => {
        mockUserRepo.findOneBy.mockReturnValue({id: 1, userRoleId: 3})
        mockAppointmentRepo.createQueryBuilder.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockRejectedValue(new Error('Database error')),
        });

        await expect(queries.Query.calendarMissedAppointments(null, { monthStart: new Date(), monthEnd: new Date(), patientId: 1 }, context))
            .rejects
            .toThrow('Error fetching missed appointments: Error: Database error');
    });
});
