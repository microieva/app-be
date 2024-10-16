import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatParticipantTable1728992732944 implements MigrationInterface {
    name = 'CreateChatParticipantTable1728992732944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat_participant" ("id" int NOT NULL IDENTITY(1,1), "deletedAt" datetime, "chatId" int, "participantId" int, CONSTRAINT "PK_b126b533dd62e4be694073b20e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "DF_19d7362db248a3df27fc29b507a"`);
        await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "message" ADD "createdAt" datetime NOT NULL CONSTRAINT "DF_19d7362db248a3df27fc29b507a" DEFAULT getdate()`);
        await queryRunner.query(`ALTER TABLE "chat_participant" ADD CONSTRAINT "FK_ee1a88c3951e64c4067cb49c5c9" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_participant" ADD CONSTRAINT "FK_62f44627317717e1b9829965be1" FOREIGN KEY ("participantId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_participant" DROP CONSTRAINT "FK_62f44627317717e1b9829965be1"`);
        await queryRunner.query(`ALTER TABLE "chat_participant" DROP CONSTRAINT "FK_ee1a88c3951e64c4067cb49c5c9"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "DF_19d7362db248a3df27fc29b507a"`);
        await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "message" ADD "createdAt" datetime2 NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "DF_19d7362db248a3df27fc29b507a" DEFAULT getdate() FOR "createdAt"`);
        await queryRunner.query(`DROP TABLE "chat_participant"`);
    }

}
