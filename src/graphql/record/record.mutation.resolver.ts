import { sendEmailNotification } from "../../services/email.service";
import { User } from "../user/user.model";
import { Record } from "./record.model";
import { Appointment } from "../appointment/appointment.model";
import { RecordInput } from "./record.input";
import { AppContext, MutationResponse } from "../types";

export const recordMutationResolver = {
    Mutation: {
        saveRecord: async (parent: null, args: any, context: AppContext) => {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});
            const input: RecordInput = args.recordInput;

            if (!dbMe || (dbMe && dbMe.userRoleId !== 2)) {
                return {
                    success: false,
                    message: 'Unauthorized action'
                } as MutationResponse;
            }

            const repo = context.dataSource.getRepository(Record);
            const dbAppointment = await context.dataSource.getRepository(Appointment).findOneBy({id: input.appointmentId});

            if (input.id) {
                const dbRecord: Record = await repo
                    .createQueryBuilder('record')
                    .leftJoinAndSelect('record.patient', 'patient')
                    .leftJoinAndSelect('record.doctor', 'doctor')
                    .where({id: input.id})
                    .getOne();

                dbRecord.title = input.title;
                dbRecord.text = input.text;
                dbRecord.draft = input.draft;

                try {
                    await repo.save(dbRecord);

                    if (!input.draft) {
                        sendEmailNotification(dbRecord, "recordSaved")
                    }
                    return {
                        success: true,
                        message: "Medical record updated"
                    } as MutationResponse;
                } catch (error) {
                    return {
                        success: false,
                        message: 'Unexpected error while updating medical record: '+error
                    } as MutationResponse;
                }
            } else {
                const newRecord = new Record();
                newRecord.title = input.title;
                newRecord.text = input.text;
                newRecord.appointmentId = input.appointmentId;
                newRecord.draft = input.draft;
                newRecord.updatedAt = null;
                newRecord.doctorId = context.me.userId;
                newRecord.patientId = dbAppointment.patientId;

                try {
                    const saved = await repo.save(newRecord);
                    dbAppointment.recordId = saved.id;
                    await context.dataSource.getRepository(Appointment).save(dbAppointment);
                    return {
                        success: true,
                        message: "Medical record saved"
                    } as MutationResponse;
                } catch (error) {
                    return {
                        success: false,
                        message: 'Unexpected error while saving medical record: '+error
                    } as MutationResponse;
                }
            }   
        },
        deleteRecord: async (parent: null, args: any, context: AppContext)=> {
            const dbMe = await context.dataSource.getRepository(User).findOneBy({id: context.me.userId});

            if (!dbMe || (dbMe && dbMe.userRoleId !== 2)) {
                return {
                    success: false,
                    message: 'Unauthorized action'
                } as MutationResponse;
            }

            const repo = context.dataSource.getRepository(Record);
            const dbRecord = await repo.findOneBy({id: args.recordId});

            if (!dbRecord) {
                return {
                    success: false,
                    message: 'Record not found'
                } as MutationResponse;
            }
            try {
                await repo.delete({id: args.recordId});
                return {
                    success: true,
                    message: 'Record deleted'
                } as MutationResponse;
            } catch (error) {
                return {
                    success: false,
                    message: 'Unexpected error while deleting medical record: '+error
                } as MutationResponse;
            }
        }
    }
}