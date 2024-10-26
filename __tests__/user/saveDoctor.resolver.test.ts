import { DoctorRequest } from "../../src/graphql/doctor-request/doctor-request.model";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";
import { userMutationResolver } from "../../src/graphql/user/user.mutation.resolver";
import { mockUsers, mockDoctorRequests } from "../../src/test-utils/mock-data";


describe('saveDoctor Resolver', () => {
    let context = {} as AppContext;
    let userId: number;
    
    beforeEach(() => {
        context = {
            io: null,
            me: { userId },
            dataSource: {
                getRepository: jest.fn().mockImplementation((entity) => {
                    if (entity === User) return mockUsers;
                    else if (entity === DoctorRequest) return mockDoctorRequests;
                    
                    else return [];
                }),
            },
        };
    });

    it('should return unauthorized if user is not an admin', async () => {
        const unauthorizedUser = mockUsers[2]; 
        userId = 3;
        context.dataSource.getRepository(User).findOneBy.mockResolvedValue(unauthorizedUser);

        const result = await userMutationResolver.Mutation.saveDoctor(null, { doctorRequestId: 1 }, context);
        expect(result).toEqual({
            success: false,
            message: "Unauthorized action",
        });
    });

    it('should return an error if doctor request is not found', async () => {
        const adminUser = mockUsers[0];
        userId = 1;
        context.dataSource.getRepository(User).findOneBy.mockResolvedValue(adminUser);
        context.dataSource.getRepository(DoctorRequest).findOneBy.mockResolvedValue(null);

        const result = await userMutationResolver.Mutation.saveDoctor(null, { doctorRequestId: 1 }, context);
        expect(result).toEqual({
            success: false,
            message: "Doctor request id not found",
        });
    });

    it('should successfully save user details and delete doctor request', async () => {
        const adminUser = mockUsers[0];
        userId = 1;
        const mockDoctorRequest = {
            id: 1,
            email: 'test@doctor.com',
            firstName: 'John',
            lastName: 'Doe',
            userRoleId: 2,
        };
        const mockSavedUser = { ...mockDoctorRequest, id: 2 };

        // Mock admin and doctor request retrieval
        context.dataSource.getRepository(User).findOneBy.mockResolvedValue(adminUser);
        context.dataSource.getRepository(DoctorRequest).findOneBy.mockResolvedValue(mockDoctorRequest);

        // Mock saving and deletion
        context.dataSource.getRepository(User).save.mockResolvedValue(mockSavedUser);
        context.dataSource.getRepository(DoctorRequest).delete.mockResolvedValue({ affected: 1 });

        const result = await userMutationResolver.Mutation.saveDoctor(null, { doctorRequestId: 1 }, context);

        expect(result).toEqual({
            success: true,
            message: "User details moved to user table",
        });
        expect(context.dataSource.getRepository(User).save).toHaveBeenCalledWith(expect.objectContaining({
            email: mockDoctorRequest.email,
            firstName: mockDoctorRequest.firstName,
            lastName: mockDoctorRequest.lastName,
            userRoleId: mockDoctorRequest.userRoleId,
        }));
        expect(context.dataSource.getRepository(DoctorRequest).delete).toHaveBeenCalledWith({ id: mockDoctorRequest.id });
    });

    it('should return an error if saving the user fails', async () => {
        const adminUser = mockUsers[0];
        userId = 1;
        const mockDoctorRequest = {
            id: 1,
            email: 'test@doctor.com',
            firstName: 'John',
            lastName: 'Doe',
            userRoleId: 2,
        };
        context.dataSource.getRepository(User).findOneBy.mockResolvedValue(adminUser);
        context.dataSource.getRepository(DoctorRequest).findOneBy.mockResolvedValue(mockDoctorRequest);

        // Mock error on saving user
        context.dataSource.getRepository(User).save.mockRejectedValue(new Error('DB Error'));

        const result = await userMutationResolver.Mutation.saveDoctor(null, { doctorRequestId: 1 }, context);

        expect(result).toEqual({
            success: false,
            message: expect.stringContaining('Cannot move user details:'),
        });
    });
});
