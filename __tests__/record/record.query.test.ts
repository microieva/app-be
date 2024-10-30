import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { Record } from "../../src/graphql/record/record.model";

describe('record Query Resolver', () => {
    let context: AppContext;
    let mockRecordRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockRecordRepo = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
        };

        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === Record) return mockRecordRepo;
                return null;
            }),
        };

        context = {
            dataSource: mockDataSource,
        } as AppContext;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return a record with appointment details for a given appointmentId', async () => {
        const appointmentId = 10;
        const mockRecord = {
            id: 1,
            appointment: { id: appointmentId, patient: { id: 3 } },
        };

        mockRecordRepo.getOne.mockResolvedValue(mockRecord);

        const result = await queries.Query.record(null, { appointmentId }, context);

        expect(result).toEqual(mockRecord);
        expect(mockRecordRepo.createQueryBuilder).toHaveBeenCalledWith('record');
        expect(mockRecordRepo.leftJoinAndSelect).toHaveBeenCalledWith('record.appointment', 'appointment');
        expect(mockRecordRepo.leftJoinAndSelect).toHaveBeenCalledWith('appointment.patient', 'patient');
        expect(mockRecordRepo.where).toHaveBeenCalledWith({ appointmentId });
        expect(mockRecordRepo.getOne).toHaveBeenCalled();
    });

    it('should return a record with appointment details for a given recordId', async () => {
        const recordId = 5;
        const mockRecord = {
            id: recordId,
            appointment: { id: 2, patient: { id: 4 } },
        };

        mockRecordRepo.getOne.mockResolvedValue(mockRecord);

        const result = await queries.Query.record(null, { recordId }, context);

        expect(result).toEqual(mockRecord);
        expect(mockRecordRepo.createQueryBuilder).toHaveBeenCalledWith('record');
        expect(mockRecordRepo.leftJoinAndSelect).toHaveBeenCalledWith('record.appointment', 'appointment');
        expect(mockRecordRepo.leftJoinAndSelect).toHaveBeenCalledWith('appointment.patient', 'patient');
        expect(mockRecordRepo.where).toHaveBeenCalledWith({ id: recordId });
        expect(mockRecordRepo.getOne).toHaveBeenCalled();
    });

    it('should throw an error if an unexpected error occurs', async () => {
        const recordId = 7;
        mockRecordRepo.getOne.mockRejectedValue(new Error('Database error'));

        await expect(queries.Query.record(null, { recordId }, context)).rejects.toThrow('Database error');
    });
});
