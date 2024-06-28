import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUserNullableColumns1719512117729 implements MigrationInterface {
    name='AlterUserNullableColumns1719512117729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" ALTER COLUMN "phone" INT NULL
            ALTER TABLE "user" ALTER COLUMN "dob" DATE NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Not implemented");
    }

}
