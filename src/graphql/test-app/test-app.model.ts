import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class TestApp {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  testAppName: string;

  @Column({ default: false })
  isAppConnected: boolean;
}