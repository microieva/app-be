import jwt from 'jsonwebtoken';
import { DateTime } from 'luxon';
import { AppContext } from '../../src/graphql/types';
import { mockUsers } from '../../src/test-utils/mock-data';
import { User } from '../../src/graphql/user/user.model';
import { userMutationResolver } from '../../src/graphql/user/user.mutation.resolver';

process.env.JWT_SECRET = 'test_secret';

const mockUser = {...mockUsers[0], validatePassword: jest.fn()} // admin

const mockContext: AppContext = {
    io: null,
    dataSource: {
        getRepository: jest.fn().mockReturnValue({
            findOneBy: jest.fn(),
            save: jest.fn(),
        }),
    },
    me: { userId: mockUser.id },
};

describe('login Resolver', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a token and expiration time if login is successful', async () => {
        mockContext.dataSource.getRepository(User).findOneBy.mockResolvedValue(mockUser);
        mockUser.validatePassword.mockResolvedValue(true);

        const input = { email: 'test@example.com', password: 'correct_password' };
        const response = await userMutationResolver.Mutation.login(null, { directLoginInput: input }, mockContext);

        const decodedToken = jwt.verify(response.token, process.env.JWT_SECRET!);
        expect(decodedToken).toHaveProperty('userId', mockUser.id);
        expect(response).toHaveProperty('expiresAt');
    });

    it('should throw an error if email is incorrect', async () => {
        mockContext.dataSource.getRepository(User).findOneBy.mockResolvedValue(null);

        const input = { email: 'wrong@example.com', password: 'password' };
        await expect(
            userMutationResolver.Mutation.login(
                null, { directLoginInput: input }, mockContext)).rejects.toThrow('Incorrect email');
    });

    it('should throw an error if password is invalid', async () => {
        mockContext.dataSource.getRepository(User).findOneBy.mockResolvedValue(mockUser);
        mockUser.validatePassword.mockResolvedValue(false);

        const input = { email: 'test@example.com', password: 'wrong_password' };
        await expect(
            userMutationResolver.Mutation.login(
                null, { directLoginInput: input }, mockContext)).rejects.toThrow('Invalid password');
    });

    it('should set token expiration to 1 hour for userRoleId 3', async () => {
        const testUser = {...mockUsers[2], validatePassword: jest.fn()} 
        mockContext.dataSource.getRepository(User).findOneBy.mockResolvedValue(testUser);
        testUser.validatePassword.mockResolvedValue(true);

        const input = { email: 'test@example.com', password: 'correct_password' };
        const response = await userMutationResolver.Mutation.login(
            null, { directLoginInput: input }, mockContext);

        const expirationTime = DateTime.now().plus({ hours: 1 }).setZone('Europe/Helsinki').toISO({ suppressMilliseconds: true });
        expect(response.expiresAt).toBe(expirationTime);
    });

    it('should set token expiration to 10 hours for other user roles', async () => {
        const testUser = {...mockUsers[1], validatePassword: jest.fn()} 
        mockContext.dataSource.getRepository(User).findOneBy.mockResolvedValue(testUser);
        testUser.validatePassword.mockResolvedValue(true);

        const input = { email: 'test@example.com', password: 'correct_password' };
        const response = await userMutationResolver.Mutation.login(null, { directLoginInput: input }, mockContext);

        const expirationTime = DateTime.now().plus({ hours: 10 }).setZone('Europe/Helsinki').toISO({ suppressMilliseconds: true });
        expect(response.expiresAt).toBe(expirationTime);
    });

    it('should throw an error if saving last login date fails', async () => {
        mockContext.dataSource.getRepository(User).findOneBy.mockResolvedValue(mockUser);
        mockUser.validatePassword.mockResolvedValue(true);
        mockContext.dataSource.getRepository(User).save.mockRejectedValue(new Error('Database error'));

        const input = { email: 'test@example.com', password: 'correct_password' };
        await expect(userMutationResolver.Mutation.login(
            null, { directLoginInput: input }, mockContext)).rejects.toThrow('Cannot login, Error: Database error');
    });
});
