import { MigrationInterface, QueryRunner } from "typeorm";

export class InsertDefaultUserRoles1718880464258 implements MigrationInterface {
    name='InsertDefaultUserRoles1718880464258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT INTO user_role ("userRole") VALUES ('admin')`
        )
        await queryRunner.query(
            `INSERT INTO user_role ("userRole") VALUES ('doctor')`
        )
        await queryRunner.query(
            `INSERT INTO user_role ("userRole") VALUES ('patient')`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Not implemented")
    }

}
