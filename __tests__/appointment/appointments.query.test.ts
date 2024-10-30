import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { User } from "../../src/graphql/user/user.model";

describe('appointments Query Resolver', () => {
    let context: AppContext;
    let mockQueryBuilder: any;
    let mockAppointmentRepo: jest.Mocked<any>;
    let mockUserRepo: jest.Mocked<any>;

    beforeAll(() => {
        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            orWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        };

        mockAppointmentRepo = {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            find: jest.fn().mockResolvedValue([]),
        };

        mockUserRepo = {
            findOneBy: jest.fn(),
        };

        context = {
            io: null,
            dataSource: {
                getRepository: jest.fn().mockImplementation((entity) => {
                    if (entity === Appointment) return mockAppointmentRepo;
                    if (entity === User) return mockUserRepo;
                    return null;
                }),
            },
            me: { userId: 2 }
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw an error if user is not found', async () => {
        mockUserRepo.findOneBy.mockResolvedValue(null);

        await expect(queries.Query.appointments(null, {}, context)).rejects.toThrow('Unauthorized action');
    });

    it('should return appointments for patient', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2, userRoleId: 3 });
        mockQueryBuilder.getMany.mockResolvedValue([{ id: 1, patientId: 2 }]);

        const result = await queries.Query.appointments(null, {}, context);

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('appointment.patientId = :patientId', { patientId: 2 });
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
        expect(result).toEqual([{ id: 1, patientId: 2 }]);
    });

    it('should return all appointments for admin', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2, userRoleId: 1 });
        mockAppointmentRepo.find.mockResolvedValue([{ id: 1 }]);

        const result = await queries.Query.appointments(null, {}, context);

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
        expect(mockAppointmentRepo.find).toHaveBeenCalled();
        expect(result).toEqual([{ id: 1 }]);
    });

    it('should return appointments for doctor', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2, userRoleId: 2 });
        mockQueryBuilder.getMany.mockResolvedValue([{ id: 1, doctorId: 2 }]);

        const result = await queries.Query.appointments(null, {}, context);

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('appointment.doctorId = :doctorId', { doctorId: 2 });
        expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith('appointment.doctorId IS NULL');
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
        expect(result).toEqual([{ id: 1, doctorId: 2 }]);
    });

    it('should throw an error if fetching appointments fails', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2, userRoleId: 2 });
        mockQueryBuilder.getMany.mockRejectedValue(new Error('Database error'));

        await expect(queries.Query.appointments(null, {}, context)).rejects.toThrow('Error fetching appointments: Error: Database error');
    });
});

