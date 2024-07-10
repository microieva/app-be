import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterAppointmentAddColumns1720543249258 implements MigrationInterface {
    name='AlterAppointmentAddColumns1720543249258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "appointment" ADD "start" Date NOT NULL
            ALTER TABLE "appointment" ADD "end" Date NOT NULL
            ALTER TABLE "appointment" ADD "allDay" BIT
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Not implemented");
    }

}
