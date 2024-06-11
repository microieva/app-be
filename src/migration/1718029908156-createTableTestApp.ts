import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableTestApp1718029908156 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "test_app" (
                "id" INT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
                "testAppName" NVARCHAR(55),
                "isAppConnected" BIT NOT NULL DEFAULT 'FALSE'
            )`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
