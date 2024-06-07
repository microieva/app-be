import { MigrationInterface, QueryRunner } from "typeorm";

export class InsertTestRowToTestApp1717745848247 implements MigrationInterface {
    name='InsertTestRowToTestApp1717745848247'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT INTO "test_app" (testAppName, isAppConnected) VALUES ('testing SQL_DB connection', 1);`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Not implemented")
    }

}
