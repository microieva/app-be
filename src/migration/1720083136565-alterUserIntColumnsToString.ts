import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUserIntColumnsToString1720083136565 implements MigrationInterface {
    name='AlterUserIntColumnsToString1720083136565'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        ALTER TABLE "user" ALTER COLUMN "phone" NVARCHAR(10) NULL
        ALTER TABLE "user" ALTER COLUMN "postCode" NVARCHAR(6) NULL
    `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Not implemented");
    }

}
