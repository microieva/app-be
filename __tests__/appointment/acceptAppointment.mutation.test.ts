import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { appointmentMutationResolver } from "../../src/graphql/appointment/appointment.mutation.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";

jest.mock("../../src/services/email.service.ts");
let context: AppContext;
let mockUserRepo: any;
let mockAppointmentRepo: any;
let mockQueryBuilder: any;

beforeAll(() => {
    mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn() 
    };

    mockUserRepo = {
        findOneBy: jest.fn(),
    };

    mockAppointmentRepo = {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        save: jest.fn(),
    };

    context = {
        me: { userId: 2 },
        io: null,
        dataSource: {
            getRepository: jest.fn((entity) => {
                if (entity === Appointment) return mockAppointmentRepo;
                if (entity === User) return mockUserRepo;
                return null;
            })
        }
    }
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('acceptAppointment Mutation Resolver', () => {

    it('should return unauthorized action if user is not found or not a doctor', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 3 });

        const response = await appointmentMutationResolver.Mutation.acceptAppointment(null, { appointmentId: 123 }, context);

        expect(response).toEqual({
            success: false,
            message: "Unauthorized action"
        });
    });

    it('should return appointment not found if appointment does not exist', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ userRoleId: 2 });
        mockAppointmentRepo.createQueryBuilder().getOne.mockResolvedValue(null);

        const response = await appointmentMutationResolver.Mutation.acceptAppointment(null, { appointmentId: 123 }, context);

        expect(response).toEqual({
            success: false,
            message: "Appointment not found"
        });
    });

    it('should accept the appointment and save doctor id', async () => {
        const dbAppointment = { id: 123, doctorId: null, patientId: 456, doctor: {id: 1, email: "doctor@email.com"}, patient: {id:456, email: "patient@email.com"} };
        const emailInfo = { id: 123, doctor: { id: 1 }, patient: { id: 456 } };

        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 2, email: 'doctor@email.com' });
        mockAppointmentRepo.createQueryBuilder().getOne.mockResolvedValue(dbAppointment);
        mockAppointmentRepo.createQueryBuilder().getOne.mockResolvedValue(emailInfo);
        mockAppointmentRepo.save.mockResolvedValue(dbAppointment);

        const response = await appointmentMutationResolver.Mutation.acceptAppointment(null, { appointmentId: 123 }, context);

        expect(response).toEqual({
            success: true,
            message: "Appointment accepted. Doctor id saved"
        });
    });

    it('should handle error when saving doctor id fails', async () => {
        const dbAppointment = { id: 123, doctorId: null, patientId: 456 };

        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 2 });
        mockQueryBuilder.getOne
            .mockResolvedValueOnce(dbAppointment) 

        mockAppointmentRepo.save.mockRejectedValue(new Error('Save failed'));

        const response = await appointmentMutationResolver.Mutation.acceptAppointment(null, { appointmentId: 123 }, context);
        expect(response).toEqual({
            success: false,
            message: "Unable to save doctor id to accept appointment: Error: Save failed"
        });
    });  
});
