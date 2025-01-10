import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { getNow } from "../utils";

@Entity()
export class DoctorRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = new Date().getUTCMilliseconds() + Math.floor(Math.random() * 100);
    }
  }
  dateToLocalTime() {
      this.createdAt  = getNow();
      this.updatedAt = getNow();
  }

  @Column({nullable: false })
  email: string;

  @Column({length: 15, nullable: false })
  firstName: string;

  @Column({length: 25, nullable: false })
  lastName: string;

  @Column()
  userRoleId: number;

  @UpdateDateColumn({type: 'date', nullable: true})
  updatedAt: Date;

  @CreateDateColumn({type:'date'})
  createdAt: Date;
}