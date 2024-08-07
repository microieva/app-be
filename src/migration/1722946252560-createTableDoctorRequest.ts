import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableDoctorRequest1722946252560 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "doctor_request" (
                "id" INT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
                "firstName" NVARCHAR(15),
                "lastName" NVARCHAR(25),
                "userRoleId" INT NOT NULL,
                "email" NVARCHAR(25),
                "createdAt" DATE,
                "lastLogInAt" DATE
            )`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Not implemented!")
    }

}
