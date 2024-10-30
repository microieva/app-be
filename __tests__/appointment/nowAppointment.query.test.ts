import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { User } from "../../src/graphql/user/user.model";
import { getNow } from "../../src/graphql/utils";

jest.mock('../../src/graphql/utils', () => ({
    getNow: jest.fn(),
}));

describe('nowAppointment Query Resolver', () => {
    let context: AppContext;
    let mockQueryBuilder: any;
    let mockAppointmentRepo: jest.Mocked<any>;
    let mockUserRepo: jest.Mocked<any>;

    beforeAll(() => {
        mockQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
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

    it('should throw an error if user is not found or not a doctor', async () => {
        mockUserRepo.findOneBy.mockResolvedValue(null);

        await expect(queries.Query.nowAppointment(null, {}, context)).rejects.toThrow('Unauthorized action');

        mockUserRepo.findOneBy.mockResolvedValue({ id: 2, userRoleId: 1 });

        await expect(queries.Query.nowAppointment(null, {}, context)).rejects.toThrow('Unauthorized action');
    });

    it('should return the current appointment for a doctor', async () => {
        const mockAppointment = { id: 1, doctorId: 2, start: new Date(), end: new Date() };
        const now = new Date();
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2, userRoleId: 2 });
        mockQueryBuilder.getOne.mockResolvedValue(mockAppointment);
        (getNow as jest.Mock).mockReturnValue(now);

        const result = await queries.Query.nowAppointment(null, {}, context);

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('appointment.patient', 'patient');
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('appointment.patientId IS NOT NULL');
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('appointment.doctorId = :doctorId', { doctorId: context.me.userId });
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(':now BETWEEN appointment.start AND appointment.end', { now });
        expect(mockQueryBuilder.getOne).toHaveBeenCalled();
        expect(result).toEqual(mockAppointment);
    });

    it('should throw an error if fetching the appointment fails', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2, userRoleId: 2 });
        mockQueryBuilder.getOne.mockRejectedValue(new Error('Database error'));

        await expect(queries.Query.nowAppointment(null, {}, context)).rejects.toThrow('Error fetching now appointment: Error: Database error');
    });
});
