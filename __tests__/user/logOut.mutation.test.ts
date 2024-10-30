import { AppContext } from "../../src/graphql/types";
import { userMutationResolver } from "../../src/graphql/user/user.mutation.resolver";
import { getNow } from "../../src/graphql/utils";


jest.mock('../../src/graphql/utils', () => ({
  getNow: jest.fn(),
}));

describe('logOut resolver', () => {
  let context: AppContext;
  let userRepo: jest.Mocked<any>;
  
  beforeEach(() => {
    userRepo = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    context = {
      dataSource: {
        getRepository: jest.fn().mockImplementation(() => userRepo),
      },
      me: { userId: 1 }, 
    } as AppContext;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update lastLogOutAt with current time on successful logout', async () => {
    const mockUser = { id: 1, lastLogOutAt: null };
    const mockNow = new Date('2024-10-15T12:00:00Z');

    userRepo.findOneBy.mockResolvedValue(mockUser);
    (getNow as jest.Mock).mockReturnValue(mockNow);

    await userMutationResolver.Mutation.logOut(null, {}, context);

    expect(userRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
    expect(mockUser.lastLogOutAt).toEqual(mockNow);
    expect(userRepo.save).toHaveBeenCalledWith(mockUser);
  });

  it('should log error if saving user logout time fails', async () => {
    const mockUser = { id: 1, lastLogOutAt: null };
    const mockNow = new Date('2024-10-15T12:00:00Z');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    userRepo.findOneBy.mockResolvedValue(mockUser);
    userRepo.save.mockRejectedValue(new Error('Save failed'));
    (getNow as jest.Mock).mockReturnValue(mockNow);

    await userMutationResolver.Mutation.logOut(null, {}, context);

    expect(userRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
    expect(userRepo.save).toHaveBeenCalledWith(mockUser);
    expect(consoleSpy).toHaveBeenCalledWith('Log out error: ', expect.any(Error));

    consoleSpy.mockRestore();
  });
});
