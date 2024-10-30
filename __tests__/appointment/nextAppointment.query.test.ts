import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { Record } from "../../src/graphql/record/record.model";
import { User } from "../../src/graphql/user/user.model";
import { getNow } from "../../src/graphql/utils";

describe('nextAppointment Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;
    let mockRecordRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn()
        };
        mockAppointmentRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            innerJoin: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getExists: jest.fn(),
            getMany: jest.fn(),
            findOne: jest.fn(),
        };
        mockRecordRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            innerJoin: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getMany: jest.fn()
        };

        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === User) return mockUserRepo;
                if (entity === Appointment) return mockAppointmentRepo;
                if (entity === Record) return mockRecordRepo;
                return null;
            }),
        };

        context = {
            dataSource: mockDataSource,
            me: { userId: 1 },
        } as AppContext;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should throw an error if user is unauthorized (no user or admin)', async () => {
        mockUserRepo.findOneBy.mockReturnValue(null);

        await expect(queries.Query.nextAppointment(null, {}, context)).rejects.toThrow("Unauthorized action");

        mockUserRepo.findOneBy.mockReturnValue({ id: 1, userRoleId: 1 });
        await expect(queries.Query.nextAppointment(null, {}, context)).rejects.toThrow("Unauthorized action");
    });

    it('should return null if no upcoming appointments exist', async () => {
        mockUserRepo.findOneBy.mockReturnValue({ id: 1, userRoleId: 2 });
        mockAppointmentRepo.getExists.mockResolvedValue(false);

        const result = await queries.Query.nextAppointment(null, {}, context);

        expect(result).toBeNull();
        expect(mockAppointmentRepo.createQueryBuilder).toHaveBeenCalledWith('appointment');
        expect(mockAppointmentRepo.where).toHaveBeenCalledWith('appointment.allDay = :allDay', { allDay: false });
        expect(mockAppointmentRepo.andWhere).toHaveBeenCalledWith('appointment.doctorId = :doctorId', { doctorId: context.me.userId });
    });

    it('should return next appointment details for a doctor', async () => {
        const now = getNow();
        const futureAppointments = [{ id: 10, start: now }];
        mockUserRepo.findOneBy.mockReturnValue({ id: 1, userRoleId: 2 });
        mockAppointmentRepo.getExists.mockResolvedValue(true);
        mockAppointmentRepo.getMany.mockResolvedValue(futureAppointments);
        mockAppointmentRepo.findOne.mockResolvedValue({
            id: 10,
            start: now,
            end: now,
            patient: { id: 3 },
            doctor: { id: 1 }
        });

        const previousAppointments = [{ start: new Date('2023-10-10T10:00:00Z') }];
        mockAppointmentRepo.createQueryBuilder().getMany.mockResolvedValue(previousAppointments);
        
        const recordIds = [{ id: 100 }];
        mockRecordRepo.getMany.mockResolvedValue(recordIds);

        const result = await queries.Query.nextAppointment(null, {}, context);

        expect(result).toEqual({
            nextStart: now,
            nextEnd: now,
            nextId: 10,
            previousAppointmentDate: previousAppointments[0].start,
            recordIds: [100],
            patient: { id: 3 },
            doctor: { id: 1 }
        });
    });

    it('should return next appointment details for a patient', async () => {
        const now = getNow();
        const futureAppointments = [{ id: 15, start: now }];
        mockUserRepo.findOneBy.mockReturnValue({ id: 2, userRoleId: 3 });
        mockAppointmentRepo.getExists.mockResolvedValue(true);
        mockAppointmentRepo.getMany.mockResolvedValue(futureAppointments);
        mockAppointmentRepo.findOne.mockResolvedValue({
            id: 15,
            start: now,
            end: now,
            patient: { id: 2 },
            doctor: { id: 5 }
        });

        const previousAppointments = [{ start: new Date('2023-09-20T09:00:00Z') }];
        mockAppointmentRepo.createQueryBuilder().getMany.mockResolvedValue(previousAppointments);
        
        const recordIds = [{ id: 105 }];
        mockRecordRepo.getMany.mockResolvedValue(recordIds);

        const result = await queries.Query.nextAppointment(null, {}, context);

        expect(result).toEqual({
            nextStart: now,
            nextEnd: now,
            nextId: 15,
            previousAppointmentDate: previousAppointments[0].start,
            recordIds: [105],
            patient: { id: 2 },
            doctor: { id: 5 }
        });
    });

    it('should throw an error if an unexpected error occurs', async () => {
        mockUserRepo.findOneBy.mockReturnValue({ id: 1, userRoleId: 2 });
        mockAppointmentRepo.getExists.mockRejectedValue(new Error('Database error'));

        await expect(queries.Query.nextAppointment(null, {}, context)).rejects.toThrow('Database error');
    });
});
