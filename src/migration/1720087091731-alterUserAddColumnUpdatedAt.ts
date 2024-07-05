import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUserAddColumnUpdatedAt1720087091731 implements MigrationInterface {
    name='AlterUserAddColumnUpdatedAt1720087091731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" ADD "updatedAt" Date NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Not implemented");
    }

}
