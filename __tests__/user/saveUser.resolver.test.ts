import { testDataSource } from '../../src/test-utils/test-db.config';
import { mockUsers, mockUserRoles } from '../../src/test-utils/mock-data';
import { userMutationResolver } from '../../src/graphql/user/user.mutation.resolver'; 
import { User } from '../../src/graphql/user/user.model';
import { UserRole } from '../../src/graphql/user/user-role.model';

describe('saveUser Resolver', () => {
  beforeAll(async () => {
    await testDataSource.initialize();

    const roleRepository = testDataSource.getRepository(UserRole);
    await roleRepository.save(mockUserRoles);

    const userRepository = testDataSource.getRepository(User);
    await userRepository.save(mockUsers);
  });

  afterAll(async () => {
    await testDataSource.destroy();
  });

  it('should save a new user', async () => {
    const args = {
      userInput: {
        firstName: 'Alice',
        lastName: 'Smith',
        userRoleId: 3, 
        phone: '1112223333',
        email: 'alice.smith@example.com',
        password: 'password123',
        dob: '1992-03-03',
        streetAddress: '789 Main St',
        city: 'Oldtown',
        postCode: '54321',
        lastLogInAt: '2024-10-27T00:00:00Z'
      }
    };

    
    const context = {
        dataSource: testDataSource,
        me: { userId: 1 },
        io: null
      };

    const result = await userMutationResolver.Mutation.saveUser(null, args, context);

    expect(result).toEqual({
      success: true,
      message: 'User saved'
    });

    const userRepository = testDataSource.getRepository(User);
    const savedUser = await userRepository.findOneBy({ email: 'alice.smith@example.com' });

    expect(savedUser).toBeDefined();
    expect(savedUser?.firstName).toBe('Alice');
    expect(savedUser?.lastName).toBe('Smith');
  });

  it('should update an existing user', async () => {
    const userRepository = testDataSource.getRepository(User);

    const existingUser = mockUsers[0];
    const args = {
      userInput: {
        id: existingUser.id,
        firstName: 'Admin Updated',
        lastName: 'Doe Updated',
        phone: '2223334444',
        email: 'admin.updated@example.com',
        password: 'newpassword123',
        dob: '1990-04-04',
        streetAddress: '321 Main St',
        city: 'Newcity',
        postCode: '98765',
        lastLogInAt: '2024-10-28T00:00:00Z'
      }
    };

    
    const context = {
        dataSource: testDataSource,
        me: { userId: existingUser.id },
        io: null
    };

    const result = await userMutationResolver.Mutation.saveUser(null, args, context);

    expect(result).toEqual({
      success: true,
      message: 'User saved'
    });

    const updatedUser = await userRepository.findOneBy({ id: existingUser.id });

    expect(updatedUser).toBeDefined();
    expect(updatedUser?.firstName).toBe('Admin Updated');
    expect(updatedUser?.lastName).toBe('Doe Updated');
    expect(updatedUser?.userRoleId).toBe(1);
    expect(updatedUser?.phone).toBe('2223334444');
    expect(updatedUser?.email).toBe('admin.updated@example.com');
    expect(updatedUser?.password).toBe('newpassword123');
    expect(updatedUser?.dob).toBe('1990-04-04');
    expect(updatedUser?.streetAddress).toBe('321 Main St');
    expect(updatedUser?.city).toBe('Newcity');
    expect(updatedUser?.postCode).toBe('98765');
    expect(updatedUser?.lastLogInAt.toISOString()).toBe(new Date('2024-10-28T00:00:00Z').toISOString());
  });
});

