import { Appointment } from "../../src/graphql/appointment/appointment.model";
import { Record } from "../../src/graphql/record/record.model";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";
import { userMutationResolver } from "../../src/graphql/user/user.mutation.resolver";
import { mockUsers, mockAppointments, mockRecords } from "../../src/test-utils/mock-data";

describe('deleteUser Resolver', () => {
    let context = {} as AppContext;
    let userId: number;
    
    beforeEach(() => {
        context = {
            io: null,
            me: { userId },
            dataSource: {
                getRepository: jest.fn().mockImplementation((entity) => {
                    if (entity === User) return mockUsers;
                    else if (entity === Appointment) return mockAppointments;
                    else if (entity === Record) return mockRecords;
                    else return [];
                }),
            },
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should delete user-related records and appointments before deleting the user', async () => {
        const userId = 3;
        const mockUser = mockUsers[2];


        context.dataSource.getRepository = jest.fn().mockImplementation((entity) => {
            if (entity === User) {
                return {
                    findOneBy: jest.fn().mockResolvedValue(mockUser),
                    delete: jest.fn().mockResolvedValue({}),
                };
            }
             else if (entity === Appointment) {
                return {
                    createQueryBuilder: jest.fn(() => ({
                        where: jest.fn().mockReturnThis(),
                        orWhere: jest.fn().mockReturnThis(),
                        getMany: jest.fn().mockResolvedValue(mockAppointments),
                    })),
                    delete: jest.fn().mockResolvedValue({}),
                };
            }
            else if (entity === Record) {
                return {
                    delete: jest.fn().mockResolvedValue({}),
                };
            }
            return entity;
        });

        const result = await userMutationResolver.Mutation.deleteUser(null, { userId }, context);

        expect(result).toEqual({
            success: true,
            message: 'User data removed',
        });
    });

    it('should return an error message if deleting user records fails', async () => {
        userId = 3;
        context.dataSource.getRepository = jest.fn().mockImplementation((entity) => {
            if (entity === User) {
                return { findOneBy: jest.fn().mockResolvedValue(mockUsers[2]) };
            }
            else if (entity === Appointment) {
                return {
                    createQueryBuilder: jest.fn(() => ({
                        where: jest.fn().mockReturnThis(),
                        orWhere: jest.fn().mockReturnThis(),
                        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
                    })),
                };
            }
            else if (entity === Record) {
                return { delete: jest.fn().mockRejectedValue(new Error('Delete failed')) };
            }
            return entity;
        });

        const result = await userMutationResolver.Mutation.deleteUser(null, { userId }, context);

        expect(result).toEqual({
            success: false,
            message: 'Error deleting user records: Error: Delete failed',
        });
    });

    it('should return an error message if deleting user appointments fails', async () => {
        userId = 3;
        context.dataSource.getRepository = jest.fn().mockImplementation((entity) => {
            if (entity === User) {
                return { findOneBy: jest.fn().mockResolvedValue(mockUsers[2]) };
            }
            else if (entity === Appointment) {
                return {
                    createQueryBuilder: jest.fn(() => ({
                        where: jest.fn().mockReturnThis(),
                        orWhere: jest.fn().mockReturnThis(),
                        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
                    })),
                    delete: jest.fn().mockRejectedValue(new Error('Delete failed')),
                };
            }
            else if (entity === Record) {
                return { delete: jest.fn().mockResolvedValue({}) };
            }
            return entity;
        });

        const result = await userMutationResolver.Mutation.deleteUser(null, { userId }, context);

        expect(result).toEqual({
            success: false,
            message: 'Error deleting user appointments: Error: Delete failed',
        });
    });
});