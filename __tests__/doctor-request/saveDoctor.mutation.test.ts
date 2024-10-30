import { DoctorRequest } from "../../src/graphql/doctor-request/doctor-request.model";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";
import { userMutationResolver } from "../../src/graphql/user/user.mutation.resolver";
import { mockDoctorRequests, testDoctorRequest } from "../../src/test-utils/mock-data";

describe('saveDoctor Mutation Resolver', () => {
  let context: AppContext;
  let userRepo: jest.Mocked<any>;
  let requestRepo: jest.Mocked<any>;
  
  beforeEach(() => {
    userRepo = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    requestRepo = {
      findOneBy: jest.fn(),
      delete: jest.fn(),
    };

    context = {
      dataSource: {
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === User) return userRepo;
          if (entity === DoctorRequest) return requestRepo;
        }),
      },
      me: { userId: 1 }
    } as AppContext;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return unauthorized if user is not an admin', async () => {
    context.me.userId = 2;
    userRepo.findOneBy.mockResolvedValue({ userRoleId: 2 }); 
    
    const result = await userMutationResolver.Mutation.saveDoctor(null, testDoctorRequest, context);
    
    expect(result).toEqual({
      success: false,
      message: 'Unauthorized action',
    });
  });

  it('should return error if doctor request is not found', async () => {
    userRepo.findOneBy.mockResolvedValue({ userRoleId: 1 }); 
    requestRepo.findOneBy.mockResolvedValue(null); 

    const result = await userMutationResolver.Mutation.saveDoctor(null, { doctorRequestId: 1 }, context);
    
    expect(result).toEqual({
      success: false,
      message: 'Doctor request id not found',
    });
  });

  it('should save a new user and delete doctor request if successful', async () => {
    const dbDoctorRequest = mockDoctorRequests[0];
    userRepo.findOneBy.mockResolvedValue({ userRoleId: 1 }); 
    requestRepo.findOneBy.mockResolvedValue(dbDoctorRequest); 

    const result = await userMutationResolver.Mutation.saveDoctor(null, { doctorRequestId: dbDoctorRequest.id }, context);

    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dbDoctorRequest.email,
        firstName: dbDoctorRequest.firstName,
        lastName: dbDoctorRequest.lastName,
        password: '',
        userRoleId: dbDoctorRequest.userRoleId,
      })
    );
    expect(requestRepo.delete).toHaveBeenCalledWith({ id: dbDoctorRequest.id });
    expect(result).toEqual({
      success: true,
      message: 'User details moved to user table',
    });
  });

  it('should return error message if saving user fails', async () => {
    const dbDoctorRequest = mockDoctorRequests[0];
    userRepo.findOneBy.mockResolvedValue({ userRoleId: 1 });
    requestRepo.findOneBy.mockResolvedValue(dbDoctorRequest);
    userRepo.save.mockRejectedValue(new Error('Save failed')); 

    const result = await userMutationResolver.Mutation.saveDoctor(null, { doctorRequestId: dbDoctorRequest.id }, context);

    expect(result).toEqual({
      success: false,
      message: 'Cannot move user details: Error: Save failed',
    });
  });
});
