import { DataSource } from "typeorm";
import { DoctorRequest } from "../../src/graphql/doctor-request/doctor-request.model";
import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";

describe('request Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;
    let mockRequestRepo: jest.Mocked<any>;

    beforeEach(() => {
        mockUserRepo = {
            findOneBy: jest.fn(),
        };
        mockRequestRepo = {
            findOneBy: jest.fn(),
        };
        
        const mockDataSource = {
            getRepository: jest.fn((entity) => {
                if (entity === User) return mockUserRepo;
                if (entity === DoctorRequest) return mockRequestRepo;
                return null;
            }),
        } as unknown as DataSource;

        context = {
            dataSource: mockDataSource,
            me: { userId: 1 }, 
        } as AppContext;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return doctor request if user is authorized and request exists', async () => {
        const doctorRequest = { id: 2, status: 'pending' };
        
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 1 }); 
        mockRequestRepo.findOneBy.mockResolvedValue(doctorRequest);

        const result = await queries.Query.request(null, { userId: 2 }, context);

        expect(result).toEqual(doctorRequest);
        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockRequestRepo.findOneBy).toHaveBeenCalledWith({ id: 2 });
    });

    it('should throw an error if user is not authorized', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 2 }); 

        await expect(
            queries.Query.request(null, { userId: 2 }, context)
        ).rejects.toThrow("Unauthorized action");

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockRequestRepo.findOneBy).not.toHaveBeenCalled();
    });

    it('should throw an error if doctor request is not found', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 1 }); 
        mockRequestRepo.findOneBy.mockResolvedValue(null); 

        await expect(
            queries.Query.request(null, { userId: 2 }, context)
        ).rejects.toThrow("Doctor account request not found");

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockRequestRepo.findOneBy).toHaveBeenCalledWith({ id: 2 });
    });

    it('should handle database errors when fetching doctor request', async () => {
        mockUserRepo.findOneBy.mockResolvedValue({ id: 1, userRoleId: 1 }); 
        mockRequestRepo.findOneBy.mockRejectedValue(new Error("Database error"));

        await expect(
            queries.Query.request(null, { userId: 2 }, context)
        ).rejects.toThrow("Database error");

        expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockRequestRepo.findOneBy).toHaveBeenCalledWith({ id: 2 });
    });
});
