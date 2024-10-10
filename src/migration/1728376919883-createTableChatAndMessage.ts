import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableChatAndMessage1728376919883 implements MigrationInterface {
    name='CreateTableChatAndMessage1728376919883'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "chat" (
                "id" INT NOT NULL IDENTITY(1, 1) PRIMARY KEY )`
        )
        await queryRunner.query(
            `CREATE TABLE "message" (
                "id" INT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
                "content" NVARCHAR(700),
                "createdAt" DATE,
                "isRead" BIT NOT NULL
            )`
        )
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error('Not implemented')
    }

}
