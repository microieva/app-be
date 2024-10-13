import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableChat1728805107597 implements MigrationInterface {
    name='CreateTableChat1728805107597'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "chat" (
                "id" INT NOT NULL IDENTITY(1, 1) PRIMARY KEY )`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error('Not implemented')
    }

}
