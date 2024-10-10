import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatParticipantsUserTable1728380676959 implements MigrationInterface {
    name = 'ChatParticipantsUserTable1728380676959'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat_participants_user" ("chatId" int NOT NULL, "userId" int NOT NULL, CONSTRAINT "PK_5dfe15692e289461b16eb668e68" PRIMARY KEY ("chatId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5a65f083b45e9a271fc862c34f" ON "chat_participants_user" ("chatId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3c4f8082e87de9b6f0b65c21f1" ON "chat_participants_user" ("userId") `);
        await queryRunner.query(`ALTER TABLE "message" ADD "chatId" int`);
        await queryRunner.query(`ALTER TABLE "message" ADD "senderId" int`);
        await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "message" ADD "content" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "DF_055e85cd63dcd4dc5922504a3a0" DEFAULT 0 FOR "isRead"`);
        await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "message" ADD "createdAt" datetime2 NOT NULL CONSTRAINT "DF_19d7362db248a3df27fc29b507a" DEFAULT getdate()`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_619bc7b78eba833d2044153bacc" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_participants_user" ADD CONSTRAINT "FK_5a65f083b45e9a271fc862c34ff" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat_participants_user" ADD CONSTRAINT "FK_3c4f8082e87de9b6f0b65c21f18" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_participants_user" DROP CONSTRAINT "FK_3c4f8082e87de9b6f0b65c21f18"`);
        await queryRunner.query(`ALTER TABLE "chat_participants_user" DROP CONSTRAINT "FK_5a65f083b45e9a271fc862c34ff"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_619bc7b78eba833d2044153bacc"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "DF_19d7362db248a3df27fc29b507a"`);
        await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "message" ADD "createdAt" date`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "DF_055e85cd63dcd4dc5922504a3a0"`);
        await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "message" ADD "content" nvarchar(700)`);
        await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "senderId"`);
        await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "chatId"`);
        await queryRunner.query(`DROP INDEX "IDX_3c4f8082e87de9b6f0b65c21f1" ON "chat_participants_user"`);
        await queryRunner.query(`DROP INDEX "IDX_5a65f083b45e9a271fc862c34f" ON "chat_participants_user"`);
        await queryRunner.query(`DROP TABLE "chat_participants_user"`);
    }

}
