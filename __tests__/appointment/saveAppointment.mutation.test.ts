import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";
import { appointmentMutationResolver } from '../../src/graphql/appointment/appointment.mutation.resolver';

jest.mock("../../src/services/email.service.ts");
let context: AppContext;
let mockUserRepo: jest.Mocked<any>;
let mockAppointmentRepo: jest.Mocked<any>;

beforeEach(() => {
    mockUserRepo = {
        findOneBy: jest.fn(),
    };

    mockAppointmentRepo = {
        findOneBy: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        save: jest.fn(),
    };

    const mockDataSource = {
        getRepository: jest.fn((entity) => {
            if (entity === User) return mockUserRepo;
            if (entity === Appointment) return mockAppointmentRepo;
            return null;
        }),
    };

    context = {
        dataSource: mockDataSource,
        me: { userId: 1 },
    } as AppContext;
});

afterEach(()=> {
    jest.clearAllMocks();
})

describe("saveAppointment Mutation Resolver", () => {

    it("returns unauthorized when user is not found", async () => {
        mockUserRepo.findOneBy.mockResolvedValue(null);

        const result = await appointmentMutationResolver.Mutation.saveAppointment(null, { appointmentInput: {} }, context);

        expect(result).toEqual({
            success: false,
            message: "Unauthorized action",
        });
        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
    });

    it("creates a new appointment for userRoleId 3 without 'allDay' flag", async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 3 });
        const input = { start: new Date().toISOString(), end: new Date().toISOString(), patientMessage: "Check-up" };

        const result = await appointmentMutationResolver.Mutation.saveAppointment(null, { appointmentInput: input }, context);

        expect(result).toEqual({
            success: true,
            message: "Appointment created",
        });
        expect(mockAppointmentRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                patientId: context.me.userId,
                patientMessage: input.patientMessage,
                allDay: false,
            })
        );
    });

    it("returns error if patient attempts to create an 'allDay' appointment", async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 3 });
        const input = { start: new Date().toISOString(), end: new Date().toISOString(), allDay: true };

        const result = await appointmentMutationResolver.Mutation.saveAppointment(null, { appointmentInput: input }, context);

        expect(result).toEqual({
            success: false,
            message: "Unauthorized action",
        });
    });

    it("updates appointment for a doctor", async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2, userRoleId: 2 });
        const dbAppointment = {
            id: 100,
            start: new Date('2023-10-31'),
            end: new Date('2023-10-31'),
            doctorId: 2,
            doctor: { id: 2, email: "doctor@example.com" },
            patient: {id: 5, email: "patient@email.com"}
        };
        mockAppointmentRepo.createQueryBuilder().getOne.mockResolvedValue(dbAppointment);
    
        const input = { id: 100, start: new Date(Date.now() + 200000), end: new Date(Date.now() + 300000) };
    
        const result = await appointmentMutationResolver.Mutation.saveAppointment(null, { appointmentInput: input }, context);
    
        expect(result).toEqual({
            success: true,
            message: "Appointment updated",
        });
        expect(mockAppointmentRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 100,
                doctorId: 2,
                start: new Date(input.start),
                end: new Date(input.end),
            })
        );
    });
    

    it("returns error if patient tries to update accepted appointment", async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 3, userRoleId: 3 });
        const dbAppointment = { id: 200, start: new Date(), end: new Date(), doctorId: 5 };
        mockAppointmentRepo.createQueryBuilder().getOne.mockResolvedValue(dbAppointment);

        const input = { id: 200, start: new Date().toISOString(), end: new Date().toISOString() };

        const result = await appointmentMutationResolver.Mutation.saveAppointment(null, { appointmentInput: input }, context);

        expect(result).toEqual({
            success: false,
            message: "Forbidden action: the appointment cannot be moved because it has been already accepted... Consider cancelling and making a new one on more suitable date.",
        });
    });

    it("returns error if save operation fails", async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 3 });
        mockAppointmentRepo.save.mockRejectedValue(new Error("Database error"));

        const input = { start: new Date().toISOString(), end: new Date().toISOString() };

        const result = await appointmentMutationResolver.Mutation.saveAppointment(null, { appointmentInput: input }, context);

        expect(result).toEqual({
            success: false,
            message: "Unexpected error while creating appointment: Error: Database error",
        });
    });
});
