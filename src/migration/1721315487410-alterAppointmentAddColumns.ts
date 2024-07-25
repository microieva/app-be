import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterAppointmentAddColumns1721315487410 implements MigrationInterface {
    name='AlterAppointmentAddColumns1721315487410'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "appointment" ALTER COLUMN "patientMessage" NVARCHAR(700) NULL
            ALTER TABLE "appointment" ALTER COLUMN "doctorMessage" NVARCHAR(700) NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
