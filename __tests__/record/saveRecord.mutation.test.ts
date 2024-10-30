import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { Record } from "../../src/graphql/record/record.model";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";
import { recordMutationResolver } from "../../src/graphql/record/record.mutation.resolver";

jest.mock("../../src/services/email.service.ts");
describe('saveRecord Mutation Resolver', () => {
    let context: AppContext;
    let mockQueryBuilder: any;
    let mockRecordRepo: jest.Mocked<any>;
    let mockAppointmentRepo: jest.Mocked<any>;
    let mockUserRepo: jest.Mocked<any>;

    beforeAll(() => {
        mockQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue({
                id: 1,
                title: 'Draft Title',
                text: 'Draft Text',
                draft: true,
                appointmentId: 1
            }),
        };

        mockAppointmentRepo = {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            save: jest.fn(),
            findOneBy: jest.fn(),
        };

        
        mockRecordRepo = {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOneBy: jest.fn(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
            save: jest.fn(),
        };

        mockUserRepo = {
            findOneBy: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
        };

        context = {
            io:null,
            dataSource: {
                getRepository: jest.fn().mockImplementation((entity) => {
                    if (entity === Appointment) return mockAppointmentRepo;
                    if (entity === Record) return mockRecordRepo;
                    if (entity === User) return mockUserRepo;
                    return null;
                }),
            },
            me: { userId: 2 }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return unauthorized action if user is not authorized', async () => {
        mockUserRepo.findOneBy.mockResolvedValue(null); 

        const result = await recordMutationResolver.Mutation.saveRecord(null, { recordInput: {} }, context);

        expect(result).toEqual({
            success: false,
            message: 'Unauthorized action',
        });
    });

    it('should return unauthorized action if user role is not doctor', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 3 }); 

        const result = await recordMutationResolver.Mutation.saveRecord(null, { recordInput: {} }, context);

        expect(result).toEqual({
            success: false,
            message: 'Unauthorized action',
        });
    });

    it('should return appointment not found if appointment does not exist', async () => {
        const input = { appointmentId: 123, title: 'Record Title', text: 'Record Text', draft: false, patientId: 3, doctorId: 2 };
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 2 }); 
        mockAppointmentRepo.createQueryBuilder().getOne.mockResolvedValue(null); 

        const result = await recordMutationResolver.Mutation.saveRecord(null, { recordInput: input }, context);

        expect(result).toEqual({
            success: false,
            message: 'Linked appointment not found',
        });
    });

    it('should update existing record', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 2 }); 
        const input = {
            id: 1,
            title: 'Updated Title',
            text: 'Updated Text',
            draft: false,
            appointmentId: 1,
        };

        const mockDbRecord = {
            id: 1,
            title: 'Draft Title',
            text: 'Draft Text',
            draft: true,
            appointmentId: 1,
            patient: { id: 3},
            doctor: {id: 1},
            patientId: 3,
            doctorId: 1
        }
    
        const args = { recordInput: input };
        mockAppointmentRepo.findOneBy.mockResolvedValue({id: 1}); 
        mockAppointmentRepo.createQueryBuilder().getOne.mockResolvedValue(mockDbRecord);
        const result = await recordMutationResolver.Mutation.saveRecord(null, args, context);

        expect(result).toEqual({
            success: true,
            message: 'Medical record updated',
        });
    });    

    it('should create a new record if input.id is not provided', async () => {
        const input = { title: 'New Record', text: 'New Text', draft: false, appointmentId: 1 };
        const dbAppointment = { id: 1, patientId: 3, recordId: null };
        
        mockUserRepo.findOneBy.mockResolvedValue({ id: context.me.userId, userRoleId: 2 }); 
        mockAppointmentRepo.findOneBy.mockResolvedValue(dbAppointment);
        mockRecordRepo.save.mockResolvedValue({ id: 2 }); 

        const result = await recordMutationResolver.Mutation.saveRecord(null, { recordInput: input }, context);

        expect(result).toEqual({
            success: true,
            message: 'Medical record saved',
        });
        expect(mockRecordRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            title: 'New Record',
            text: 'New Text',
            appointmentId: 1,
            draft: false,
            doctorId: 2,
            patientId: 3,
            updatedAt: null
        }));
        expect(mockAppointmentRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            id: 1,
            recordId: 2,
        }));
    });

    it('should handle error when saving the record fails', async () => {
        const input = { title: 'New Record', text: 'New Text', draft: false, appointmentId: 2 };
        const dbAppointment = { id: 2, patientId: 3 };
        
        mockAppointmentRepo.findOneBy.mockResolvedValue(dbAppointment); 
        mockRecordRepo.save.mockRejectedValue(new Error('Save failed'));
        
        const result = await recordMutationResolver.Mutation.saveRecord(null, { recordInput: input }, context);

        expect(result).toEqual({
            success: false,
            message: 'Unexpected error while saving medical record: Error: Save failed',
        });
    });
});
