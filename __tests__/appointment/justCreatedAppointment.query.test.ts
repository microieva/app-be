import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { User } from "../../src/graphql/user/user.model";

describe('justCreatedAppointment Query Resolver', () => {
    let context: AppContext;
    let mockQueryBuilder: any;
    let mockAppointmentRepo: jest.Mocked<any>;
    let mockUserRepo: jest.Mocked<any>;

    beforeAll(() => {
        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
        };

        mockAppointmentRepo = {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
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

        await expect(queries.Query.justCreatedAppointment(null, { patientId: 1 }, context)).rejects.toThrow('Unauthorized action');
    });

    it('should return the most recently created appointment for a patient', async () => {
        const mockAppointment = { id: 1, patientId: 1, createdAt: new Date() };
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2 });
        mockQueryBuilder.getOne.mockResolvedValue(mockAppointment);

        const result = await queries.Query.justCreatedAppointment(null, { patientId: 1 }, context);

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('appointment.patientId = :patientId', { patientId: 1 });
        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('appointment.createdAt', 'DESC');
        expect(mockQueryBuilder.getOne).toHaveBeenCalled();
        expect(result).toEqual(mockAppointment);
    });

    it('should throw an error if fetching the appointment fails', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2 });
        mockQueryBuilder.getOne.mockRejectedValue(new Error('Database error'));

        await expect(queries.Query.justCreatedAppointment(null, { patientId: 1 }, context)).rejects.toThrow('Failed refetching new appointment Error: Database error');
    });
});
