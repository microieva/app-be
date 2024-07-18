import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterAppointmentMakeNullableColumn1721198875873 implements MigrationInterface {
    name='AlterAppointmentMakeNullableColumn1721198875873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "appointment" ALTER COLUMN "patientId" INT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Not implemented");
    }

}
