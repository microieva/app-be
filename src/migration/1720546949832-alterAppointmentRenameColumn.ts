import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterAppointmentRenameColumn1720546949832 implements MigrationInterface {
    name='AlterAppointmentRenameColumn1720546949832'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "appointment" DROP CONSTRAINT IF EXISTS "FK_appointment_customerId"
        `);

        await queryRunner.query(`
            ALTER TABLE "appointment" DROP COLUMN IF EXISTS "customerId"
        `);

        await queryRunner.query(`
            ALTER TABLE "appointment" ADD "patientId" INT
        `);

        await queryRunner.query(`
            ALTER TABLE "appointment" 
            ADD CONSTRAINT "FK_appointment_patientId" 
            FOREIGN KEY ("patientId") REFERENCES "user"("id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Not implemented");
    }

}
