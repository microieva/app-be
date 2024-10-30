import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { appointmentMutationResolver } from "../../src/graphql/appointment/appointment.mutation.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";

describe('saveAppointmentMessage Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockAppointmentRepo = {
            findOneBy: jest.fn(),
            save: jest.fn()
        };

        mockUserRepo = {
            findOneBy: jest.fn(),
        };

        context = {
            dataSource: {
                getRepository: jest.fn((entity) => {
                    if (entity === Appointment) return mockAppointmentRepo;
                    if (entity === User) return mockUserRepo;
                    return null;
                })
            },
            me: { userId: 3 },
            io: null
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return unauthorized action if user is not found', async () => {
        mockUserRepo.findOneBy.mockResolvedValue(null);

        const result = await appointmentMutationResolver.Mutation.saveAppointmentMessage(null, { appointmentId: 1, appointmentMessage: "Test message" }, context);

        expect(result).toEqual({
            success: false,
            message: 'Unauthorized action',
        });
    });

    test("should return appointment not found if appointment does not exist", async () => {
        const mockUser = { id: 1, userRoleId: 2 };  
        mockUserRepo.findOneBy.mockResolvedValue(mockUser);
        mockAppointmentRepo.findOneBy.mockResolvedValue(null);
      
        const response = await appointmentMutationResolver.Mutation.saveAppointmentMessage(null, { appointmentId: 123, appointmentMessage: "Test message" }, context);
      
        expect(response).toEqual({
          success: false,
          message: "Appointment not found"
        });
      });
      

    it('should save message as patient message if user role is 3 (patient)', async () => {
        const dbMe = { id: 1, userRoleId: 3 };
        const dbAppointment = { id: 1, patientMessage: '', doctorMessage: '', updatedAt: null };
        const args = { appointmentId: 1, appointmentMessage: "Patient message" }

        mockUserRepo.findOneBy.mockResolvedValue(dbMe);
        mockAppointmentRepo.findOneBy.mockResolvedValue(dbAppointment);

        const result = await appointmentMutationResolver.Mutation.saveAppointmentMessage(null, args, context);

        expect(dbAppointment.patientMessage).toBe("Patient message");
        expect(dbAppointment.updatedAt).toBeNull();
        expect(context.dataSource.getRepository(Appointment).save).toHaveBeenCalledWith(dbAppointment);
        expect(result).toEqual({
            success: true,
            message: 'Message saved',
        });
    });

    it('should save message as doctor message if user role is 2 (doctor)', async () => {
        const dbMe = { id: 2, userRoleId: 2 };
        const dbAppointment = { id: 1, patientMessage: '', doctorMessage: '', updatedAt: null };

        mockUserRepo.findOneBy.mockResolvedValue(dbMe);
        mockAppointmentRepo.findOneBy.mockResolvedValue(dbAppointment);

        const result = await appointmentMutationResolver.Mutation.saveAppointmentMessage(null, { appointmentId: 1, appointmentMessage: "Doctor message" }, context);

        expect(dbAppointment.doctorMessage).toBe("Doctor message");
        expect(dbAppointment.updatedAt).toBeNull();
        expect(context.dataSource.getRepository(Appointment).save).toHaveBeenCalledWith(dbAppointment);
        expect(result).toEqual({
            success: true,
            message: 'Message saved',
        });
    });

    it('should save message as patient message if user role is not 2 or 3 (admin)', async () => {
        const dbMe = { id: 3, userRoleId: 1 }; 
        const dbAppointment = { id: 1, patientMessage: '', doctorMessage: '', updatedAt: null };

        mockUserRepo.findOneBy.mockResolvedValue(dbMe);
        mockAppointmentRepo.findOneBy.mockResolvedValue(dbAppointment);

        const result = await appointmentMutationResolver.Mutation.saveAppointmentMessage(null, { appointmentId: 1, appointmentMessage: "Admin message" }, context);

        expect(dbAppointment.patientMessage).toBe("Admin message");
        expect(dbAppointment.updatedAt).toBeNull();
        expect(context.dataSource.getRepository(Appointment).save).toHaveBeenCalledWith(dbAppointment);
        expect(result).toEqual({
            success: true,
            message: 'Message saved',
        });
    });

    it('should handle error when saving message fails', async () => {
        const dbAppointment = { id: 1, patientMessage: '', doctorMessage: '', updatedAt: null };

        mockUserRepo.findOneBy.mockResolvedValue({userRoleId: 3});
        mockAppointmentRepo.findOneBy.mockResolvedValue(dbAppointment);
        mockAppointmentRepo.save.mockRejectedValue(new Error('Save failed'));

        const result = await appointmentMutationResolver.Mutation.saveAppointmentMessage(null, { appointmentId: 1, patientMessage: "Test message" }, context);

        expect(result).toEqual({
            success: false,
            message: 'Error saving appointment message: Error: Save failed',
        });
    });
});
