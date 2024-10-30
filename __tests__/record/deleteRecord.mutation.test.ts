import { Record } from "../../src/graphql/record/record.model";
import { recordMutationResolver } from "../../src/graphql/record/record.mutation.resolver";
import { User } from "../../src/graphql/user/user.model";

describe('deleteRecord Mutation Resolver', () => {
    let context: any;
    const mockUserRepo = {
        findOneBy: jest.fn(),
    };
    const mockRecordRepo = {
        findOneBy: jest.fn(),
        delete: jest.fn(),
    };

    beforeAll(() => {
        context = {
            dataSource: {
                getRepository: jest.fn((entity) => {
                    if (entity === User) return mockUserRepo;
                    if (entity === Record) return mockRecordRepo;
                    return null;
                }),
            },
            me: { userId: 2 },
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return unauthorized if user is not a doctor', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2, userRoleId: 1 }); // Not a doctor

        const result = await recordMutationResolver.Mutation.deleteRecord(null, { recordId: 1 }, context);

        expect(result).toEqual({
            success: false,
            message: 'Unauthorized action',
        });
    });

    it('should return record not found if no record exists with given id', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2, userRoleId: 2 });
        mockRecordRepo.findOneBy.mockResolvedValue(null);

        const result = await recordMutationResolver.Mutation.deleteRecord(null, { recordId: 1 }, context);

        expect(result).toEqual({
            success: false,
            message: 'Record not found',
        });
    });

    it('should delete the record successfully if user is authorized', async () => {
        const dbRecord = { id: 1, title: 'Test Record' };
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2, userRoleId: 2 }); 
        mockRecordRepo.findOneBy.mockResolvedValue(dbRecord); 
        mockRecordRepo.delete.mockResolvedValue({ affected: 1 });

        const result = await recordMutationResolver.Mutation.deleteRecord(null, { recordId: 1 }, context);

        expect(result).toEqual({
            success: true,
            message: 'Record deleted',
        });
        expect(mockRecordRepo.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it('should handle unexpected errors during record deletion', async () => {
        const dbRecord = { id: 1, title: 'Test Record' };
        mockUserRepo.findOneBy.mockResolvedValue({ id: 2, userRoleId: 2 });
        mockRecordRepo.findOneBy.mockResolvedValue(dbRecord);
        mockRecordRepo.delete.mockRejectedValue(new Error('Deletion failed'));

        const result = await recordMutationResolver.Mutation.deleteRecord(null, { recordId: 1 }, context);

        expect(result).toEqual({
            success: false,
            message: 'Unexpected error while deleting medical record: Error: Deletion failed',
        });
    });
});
