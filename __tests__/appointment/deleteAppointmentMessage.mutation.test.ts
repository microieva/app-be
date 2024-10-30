import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { appointmentMutationResolver } from "../../src/graphql/appointment/appointment.mutation.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";


describe('deleteAppointmentMessage Mutation Resolver', () => {
    let context: AppContext;
    let mockUserRepo: any;
    let mockAppointmentRepo: any;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn()
        };

        mockAppointmentRepo = {
            findOneBy: jest.fn(),
            save: jest.fn(),
        };

        context = {
            me: { userId: 1 },
            dataSource: {
                getRepository: jest.fn((entity) => {
                    if (entity === Appointment) return mockAppointmentRepo;
                    if (entity === User) return mockUserRepo;
                    return null;
                })
            }
        } as unknown as AppContext;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return unauthorized action if user is not found', async () => {
        mockUserRepo.findOneBy.mockResolvedValue(null);

        const response = await appointmentMutationResolver.Mutation.deleteAppointmentMessage(null, { appointmentId: 123 }, context);

        expect(response).toEqual({
            success: false,
            message: "Unauthorized action"
        });
    });

    it('should return appointment not found if appointment does not exist', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 3 });
        mockAppointmentRepo.findOneBy.mockResolvedValue(null);

        const response = await appointmentMutationResolver.Mutation.deleteAppointmentMessage(null, { appointmentId: 123 }, context);

        expect(response).toEqual({
            success: false,
            message: "Appointment not found"
        });
    });

    it('should remove doctor message if user is a doctor', async () => {
        const dbAppointment = { id: 123, doctorMessage: "Doctor's message" };
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockAppointmentRepo.findOneBy.mockResolvedValue(dbAppointment);
        mockAppointmentRepo.save.mockResolvedValue(dbAppointment);

        const response = await appointmentMutationResolver.Mutation.deleteAppointmentMessage(null, { appointmentId: 123 }, context);

        expect(response).toEqual({
            success: true,
            message: "Message removed"
        });
        expect(dbAppointment.doctorMessage).toBeNull();
    });

    it('should remove patient message if user is not a doctor', async () => {
        const dbAppointment = { id: 123, patientMessage: "Patient's message" };
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 3 });
        mockAppointmentRepo.findOneBy.mockResolvedValue(dbAppointment);
        mockAppointmentRepo.save.mockResolvedValue(dbAppointment);

        const response = await appointmentMutationResolver.Mutation.deleteAppointmentMessage(null, { appointmentId: 123 }, context);

        expect(response).toEqual({
            success: true,
            message: "Message removed"
        });
        expect(dbAppointment.patientMessage).toBeNull();
    });

    it('should handle error when removing message fails', async () => {
        const dbAppointment = { id: 123, patientMessage: "Patient's message" };
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 3 });
        mockAppointmentRepo.findOneBy.mockResolvedValue(dbAppointment);
        mockAppointmentRepo.save.mockRejectedValue(new Error('Save failed'));

        const response = await appointmentMutationResolver.Mutation.deleteAppointmentMessage(null, { appointmentId: 123 }, context);

        expect(response).toEqual({
            success: false,
            message: 'Error removing appointment message: Error: Save failed'
        });
    });
});
