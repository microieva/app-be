import { DataSource } from "typeorm";
import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";

describe('allAppointments Query Resolver', () => {
    let context: AppContext;
    let mockAppointmentRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockAppointmentRepo = {
            createQueryBuilder: jest.fn().mockReturnValue({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                getMany: jest.fn(),
            }),
        };

        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === Appointment) return mockAppointmentRepo;
                return null;
            }),
        } as unknown as DataSource;

        context = {
            dataSource: mockDataSource,
        } as AppContext;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return all appointments', async () => {
        const mockAppointments = [
            { id: 1, patient: { id: 1, firstName: 'Alice' } },
            { id: 2, patient: { id: 2, firstName: 'Bob' } },
        ];

        mockAppointmentRepo.createQueryBuilder().getMany.mockResolvedValue(mockAppointments);

        const result = await queries.Query.allAppointments(null, {}, context);

        expect(result).toEqual(mockAppointments);
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should handle database errors and throw appropriate error message', async () => {
        mockAppointmentRepo.createQueryBuilder().getMany.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.allAppointments(null, {}, context)
        ).rejects.toThrow("Database error");

        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalled();
    });
});