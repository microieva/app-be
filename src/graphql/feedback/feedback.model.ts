import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { getNow } from "../utils";

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable: true })
  email: string;

  @Column({length: 15, nullable: true })
  name: string;

  @Column({length: 1000, nullable: false })
  text: string;

  @Column({default:false})
  isRead:boolean;

  @BeforeInsert()
  dateToLocalTime() {
      this.createdAt  = getNow();
  }

  @CreateDateColumn({type:'datetime'})
  createdAt: Date;
}