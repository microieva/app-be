import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userRole: string;
}