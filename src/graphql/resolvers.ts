import { GraphQLScalarType, Kind } from "graphql";
import { queries } from "./query.resolver";
import { userResolver } from "./user/user.resolver";
import { doctorRequestMutationResolver } from "./doctor-request/doctor-request.mutation.resolver";
import { userMutationResolver } from "./user/user.mutation.resolver";
import { appointmentMutationResolver } from "./appointment/appointment.mutation.resolver";
import { appointmentResolver } from "./appointment/appointment.resolver";
import { recordMutationResolver } from "./record/record.mutation.resolver";
import { recordResolver } from "./record/record.resolver";
import { messageMutationResolver } from "./message/message.mutation.resolver";
import { Appointment } from "./appointment/appointment.model";
import { Record } from "./record/record.model";
import { DoctorRequest } from "./doctor-request/doctor-request.model";
import { User } from "./user/user.model";
import { chatParticipantMutationResolver } from "./chat-participant/chat-participant.mutation.resolver";
import { feedbackMutationResolver } from "./feedback/feedback.mutation.resolver";
import { Feedback } from "./feedback/feedback.model";

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
            if (obj instanceof Feedback) {
                return 'Feedback';
            }
            return null; 
        }
    }
}

const scalars = {
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        serialize(value: Date) {
          	return value;
        },
        parseValue(value) {
			if (typeof value === 'number' || typeof value === 'string') {
				return new Date(value); 
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
    }),
    Void: new GraphQLScalarType({
        name: 'Void',
        description: 'Represents NULL value',
    
        serialize() {
            return null
        },    
        parseValue() {
            return null
        },   
        parseLiteral() {
            return null
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
    feedbackMutationResolver,
    appointmentMutationResolver,
    appointmentResolver,
    recordMutationResolver,
    recordResolver,
    messageMutationResolver,
    chatParticipantMutationResolver,
]
