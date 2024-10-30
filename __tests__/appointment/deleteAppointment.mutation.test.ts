import { DateTime } from 'luxon';
import { AppContext } from '../../src/graphql/types';
import { Appointment } from '../../src/graphql/appointment/appointment.model';
import { User } from '../../src/graphql/user/user.model';
import { appointmentMutationResolver } from '../../src/graphql/appointment/appointment.mutation.resolver';

jest.mock("../../src/services/email.service"); 

describe('deleteAppointment Mutation Resolver', () => {
    let context: AppContext;
    let mockQueryBuilder: any;
    let mockUserRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn()
        };

        mockAppointmentRepo = {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            save: jest.fn(),
            delete: jest.fn().mockResolvedValue({}),
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
            io: {
                emit: jest.fn(),
            },
            me: { userId: 1 },
        };
    });

    it('should return unauthorized action if user is not found', async () => {
        context.dataSource.getRepository(User).findOneBy.mockResolvedValue(null);

        const result = await appointmentMutationResolver.Mutation.deleteAppointment(null, { appointmentId: 1 }, context);

        expect(result).toEqual({
            success: false,
            message: 'Unauthorized action',
        });
    });

    it('should delete appointment and send notification if patient or admin cancels upcoming appointment', async () => {
        const dbMe = { id: 1, userRoleId: 3 };
        const appointment = {
            id: 1,
            start: DateTime.now().plus({ days: 1 }).toJSDate(),
            doctor: { id: 2 },
            doctorId: 2,
        };

        context.dataSource.getRepository(User).findOneBy.mockResolvedValue(dbMe);
        context.dataSource.getRepository(Appointment).createQueryBuilder().getOne.mockResolvedValue(appointment);

        const result = await appointmentMutationResolver.Mutation.deleteAppointment(null, { appointmentId: 1 }, context);

        expect(context.dataSource.getRepository(Appointment).delete).toHaveBeenCalledWith({ id: 1 });

        expect(result).toEqual({
            success: true,
            message: 'Appointment deleted',
        });
    });

    it('should delete appointment without sending notification if the appointment has already passed', async () => {
        const dbMe = { id: 1, userRoleId: 3 };
        const pastAppointment = {
            id: 1,
            start: DateTime.now().minus({ days: 1 }).toJSDate(),
            doctor: { id: 2 },
            doctorId: 2,
        };

        context.dataSource.getRepository(User).findOneBy.mockResolvedValue(dbMe);
        context.dataSource.getRepository(Appointment).createQueryBuilder().getOne.mockResolvedValue(pastAppointment);

        const result = await appointmentMutationResolver.Mutation.deleteAppointment(null, { appointmentId: 1 }, context);

        expect(context.dataSource.getRepository(Appointment).delete).toHaveBeenCalledWith({ id: 1 });

        expect(result).toEqual({
            success: true,
            message: 'Appointment deleted',
        });
    });

    it('should delete appointment without sending notification if the user is a doctor', async () => {
        const dbMe = { id: 2, userRoleId: 2 };
        const appointment = {
            id: 1,
            start: DateTime.now().plus({ days: 1 }).toJSDate(),
            doctor: { id: 2 },
            doctorId: 2,
        };

        context.dataSource.getRepository(User).findOneBy.mockResolvedValue(dbMe);
        context.dataSource.getRepository(Appointment).createQueryBuilder().getOne.mockResolvedValue(appointment);

        const result = await appointmentMutationResolver.Mutation.deleteAppointment(null, { appointmentId: 1 }, context);

        expect(context.dataSource.getRepository(Appointment).delete).toHaveBeenCalledWith({ id: 1 });

        expect(result).toEqual({
            success: true,
            message: 'Appointment deleted',
        });
    });

    it('should return an error message if deletion fails', async () => {
        const dbMe = { id: 1, userRoleId: 3 };
        context.dataSource.getRepository(User).findOneBy.mockResolvedValue(dbMe);
        context.dataSource.getRepository(Appointment).createQueryBuilder().getOne.mockResolvedValue({ id: 1 });
        context.dataSource.getRepository(Appointment).delete.mockRejectedValue(new Error('Deletion failed'));

        const result = await appointmentMutationResolver.Mutation.deleteAppointment(null, { appointmentId: 1 }, context);

        expect(result).toEqual({
            success: false,
            message: 'Error while deleting appointment: Error: Deletion failed',
        });
    });
});
