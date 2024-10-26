import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterTableRecordAddUser1729596206431 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "record" ADD "patientId" INT
            ALTER TABLE "record" ADD "doctorId" INT
        `);
        await queryRunner.query(`
            ALTER TABLE "record" 
            ADD CONSTRAINT "FK_record_patientId" 
            FOREIGN KEY ("patientId") REFERENCES "user"("id");
            ALTER TABLE "record" 
            ADD CONSTRAINT "FK_record_doctorId" 
            FOREIGN KEY ("doctorId") REFERENCES "user"("id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error('Not implemented')
    }

}
