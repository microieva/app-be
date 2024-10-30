import { DataSource } from "typeorm";
import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";

describe('appointment Query Resolver', () => {
    let context: AppContext;
    let mockAppointmentRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockAppointmentRepo = {
            findOneBy: jest.fn(),
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

    it('should return the appointment by id', async () => {
        const mockAppointment = { id: 1, patient: { id: 1, firstName: 'Alice' } };
        mockAppointmentRepo.findOneBy.mockResolvedValue(mockAppointment);
        
        const result = await queries.Query.appointment(null, { appointmentId: 1 }, context);

        expect(result).toEqual(mockAppointment);
        expect(mockAppointmentRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should handle database errors and throw appropriate error message', async () => {
        mockAppointmentRepo.findOneBy.mockRejectedValue(new Error('Database error'));

        await expect(
            queries.Query.appointment(null, { appointmentId: 1 }, context)
        ).rejects.toThrow("Error fetching appointments: Error: Database error");

        expect(mockAppointmentRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });
});
