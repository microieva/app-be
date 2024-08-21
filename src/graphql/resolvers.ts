import { GraphQLScalarType, Kind } from "graphql";
import { queries } from "./query.resolver";
import { userResolver } from "./user/user.resolver";
import { doctorRequestMutationResolver } from "./doctor-request/doctor-request.mutation.resolver";
import { userMutationResolver } from "./user/user.mutation.resolver";
import { appointmentMutationResolver } from "./appointment/appointment.mutation.resolver";
import { appointmentResolver } from "./appointment/appointment.resolver";
import { recordMutationResolver } from "./record/record.mutation.resolver";
import { recordResolver } from "./record/record.resolver";
import { Appointment } from "./appointment/appointment.model";
import { Record } from "./record/record.model";
import { DoctorRequest } from "./doctor-request/doctor-request.model";
import { User } from "./user/user.model";

const unions = {
    Paginated: {
        __resolveType(obj: any) {
            if (obj instanceof Appointment) {
                return "Appointment"
            }
            if (obj instanceof Record) {
                return 'Record';
            }
            if (obj instanceof DoctorRequest) {
                return 'DoctorRequest';
            }
            if (obj instanceof User) {
                return 'User';
            }
            return null; 
        }
    }
}

const scalars = {
    Date: new GraphQLScalarType({
        // name: 'Date',
        // description: 'DateTime from luxon',
        // serialize(value: Date) {
        //     return value
        //     //return DateTime.fromJSDate(value);
        //     // value sent to the client
        // },
        // parseValue(value: string){
        //   // value from client
        //   console.log('SCALAR parseValue run: ', value, typeof value)
        //   return new Date(value)
        // },
        // parseLiteral(ast) {
        //     console.log('SCALAR parseLiteral run: ', ast)
        //     if (ast.kind === Kind.INT) {
        //       return new Date(parseInt(ast.value, 10));
        //       // ast value is always in string format
        //     }
        //     return null      
        // }
        name: 'Date',
        description: 'Date custom scalar type',
        serialize(value) {
          return value;
          // if (value instanceof Date) {
          //   return value.getTime(); // Convert outgoing Date to integer for JSON
          // }
          // throw Error('GraphQL Date Scalar serializer expected a `Date` object');
        },
        parseValue(value) {
          if (typeof value === 'number' || typeof value === 'string') {
            return new Date(value); // Convert incoming integer to Date
          }
          throw new Error('GraphQL Date Scalar parser expected a `number`');
        },
        parseLiteral(ast) {
          if (ast.kind === Kind.INT) {
            // Convert hard-coded AST string to integer and then to Date
            return new Date(parseInt(ast.value, 10));
          }
          // Invalid hard-coded value (not an integer)
          return null;
        }
    })
}

export const resolvers = [
    scalars,
    unions,
    queries,
    doctorRequestMutationResolver,
    userMutationResolver,
    userResolver,
    appointmentMutationResolver,
    appointmentResolver,
    recordMutationResolver,
    recordResolver
]
