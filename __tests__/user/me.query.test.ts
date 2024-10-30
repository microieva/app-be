import { DoctorRequest } from "../../src/graphql/doctor-request/doctor-request.model";
import { queries } from "../../src/graphql/query.resolver";
import { AppContext } from "../../src/graphql/types";
import { User } from "../../src/graphql/user/user.model";

describe('me Query Resolver', () => {
    let context: AppContext;
    let mockUserRepo: jest.Mocked<any>;;
    let mockRequestRepo: jest.Mocked<any>;;

    beforeAll(() => {
        mockUserRepo = {
            findOne: jest.fn(),
        };
        mockRequestRepo = {
            findOneBy: jest.fn(),
        };

        context = {
            dataSource: {
                getRepository: jest.fn((entity) => {
                    if (entity === User) return mockUserRepo;
                    if (entity === DoctorRequest) return mockRequestRepo;
                }),
            },
            me: { userId: 1 },
            io:null
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return user account details if no active doctor request exists', async () => {
        const userAccount = { id: 1, firstName: 'John', lastName: 'Doe', userRoleId: 2 };

        mockUserRepo.findOne.mockResolvedValue(userAccount);
        mockRequestRepo.findOneBy.mockResolvedValue(null); 

        const result = await queries.Query.me(null, {}, context);

        expect(result).toEqual(userAccount);
        expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: context.me.userId } });
        expect(mockRequestRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
    });

    it('should throw an error if "me" is new doctor request', async () => {
        mockRequestRepo.findOneBy.mockResolvedValue({ id: context.me.userId }); 
        mockUserRepo.findOne.mockResolvedValue(null);

        await expect(queries.Query.me(null, {}, context)).rejects.toThrow(
            'This account request is in process. Please try later'
        );
    });

    it('should return null if user account is not found', async () => {
        mockUserRepo.findOne.mockResolvedValue(null); 
        mockRequestRepo.findOneBy.mockResolvedValue(null); 

        const result = await queries.Query.me(null, {}, context);

        expect(result).toBeNull();
        expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: context.me.userId } });
        expect(mockRequestRepo.findOneBy).toHaveBeenCalledWith({ id: context.me.userId });
    });
});
