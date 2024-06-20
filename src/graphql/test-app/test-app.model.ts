import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity(
  {orderBy: {
    testAppName: "DESC"
  }
})
export class TestApp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  testAppName: string;

  @Column({ default: false })
  isAppConnected: boolean;
}