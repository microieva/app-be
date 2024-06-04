import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateTableTestApp1717508584316 implements MigrationInterface {
    name='CreateTableTestApp1717508584316'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "test_app" (
                "id" INT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
                "testAppName" NVARCHAR(55),
                "testAppConnected" BIT
            )`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        
    }

}

