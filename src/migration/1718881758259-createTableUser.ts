import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableUser1718881758259 implements MigrationInterface {
    name='CreateTableUser1718881758259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "user" (
                "id" INT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
                "firstName" NVARCHAR(15),
                "lastName" NVARCHAR(25),
                "userRoleId" INT NOT NULL,
                "phone" INT NOT NULL,
                "password" NVARCHAR(10),
                "dob" DATE,
                "streetAddress" NVARCHAR(100),
                "city" NVARCHAR(25),
                "postCode" NVARCHAR(6),
                "createdAt" DATE,
                "lastLogInAt" DATE
            )
            ALTER TABLE "user" ADD FOREIGN KEY ("userRoleId") REFERENCES user_role("id");`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Not implemented")
    }

}
