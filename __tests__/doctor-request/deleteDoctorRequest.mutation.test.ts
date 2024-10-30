import { DoctorRequest } from "../../src/graphql/doctor-request/doctor-request.model";
import { doctorRequestMutationResolver } from "../../src/graphql/doctor-request/doctor-request.mutation.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";

describe('deleteDoctorRequest Mutation Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;;
    let mockDoctorRequestRepo: jest.Mocked<any>;;

    beforeAll(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
        };
        mockDoctorRequestRepo = {
            delete: jest.fn(),
        };

        context = {
            dataSource: {
                getRepository: jest.fn((entity) => {
                    if (entity === User) return mockUserRepo;
                    if (entity === DoctorRequest) return mockDoctorRequestRepo;
                    return null;
                }),
            },
            me: { userId: 1 },
            io:null
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a doctor request and return success message for authorized user', async () => {
        const doctorRequestId = 1;
        const authorizedUser = { id: context.me.userId, userRoleId: 1 };

        mockUserRepo.findOneBy.mockResolvedValue(authorizedUser);
        mockDoctorRequestRepo.delete.mockResolvedValue({ affected: 1 });

        const result = await doctorRequestMutationResolver.Mutation.deleteDoctorRequest(null, { doctorRequestId }, context);

        expect(result).toEqual({
            success: true,
            message: "Doctor request deleted",
        });
        expect(mockDoctorRequestRepo.delete).toHaveBeenCalledWith({ id: doctorRequestId });
    });

    it('should return unauthorized action message if user is not authorized', async () => {
        const doctorRequestId = 1;

        mockUserRepo.findOneBy.mockResolvedValue({userRoleId: 2});

        const result = await doctorRequestMutationResolver.Mutation.deleteDoctorRequest(null, { doctorRequestId }, context);

        expect(result).toEqual({
            success: false,
            message: "Unauthorized action",
        });
        expect(mockDoctorRequestRepo.delete).not.toHaveBeenCalled();
    });

    it('should handle error if deletion fails', async () => {
        const doctorRequestId = 1;
        const authorizedUser = { id: context.me.userId, userRoleId: 1 };

        mockUserRepo.findOneBy.mockResolvedValue(authorizedUser);
        mockDoctorRequestRepo.delete.mockRejectedValue(new Error('Delete failed'));

        const result = await doctorRequestMutationResolver.Mutation.deleteDoctorRequest(null, { doctorRequestId }, context);

        expect(result).toEqual({
            success: false,
            message: "Request cannot be deleted: Error: Delete failed",
        });
        expect(mockDoctorRequestRepo.delete).toHaveBeenCalledWith({ id: doctorRequestId });
    });
});
