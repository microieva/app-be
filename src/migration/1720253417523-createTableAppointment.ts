import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableAppointment1720253417523 implements MigrationInterface {
    name='CreateTableAppointment1720253417523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "appointment" (
                "id" INT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
                "customerId" INT NOT NULL,
                "doctorId" INT NULL,
                "createdAt" DATE,
                "updatedAt" DATE NULL
            )
            ALTER TABLE "appointment" ADD FOREIGN KEY ("customerId") REFERENCES "user" ("id")
            ALTER TABLE "appointment" ADD FOREIGN KEY ("doctorId") REFERENCES "user" ("id")`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Not implemented");
    }

}
