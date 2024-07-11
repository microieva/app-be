import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn } from "typeorm";
import { User } from "./user.model";

@Entity()
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userRole: string;
  
  @OneToMany(()=> User, user => user.userRole)
  @JoinColumn({ name: "userRole" }) 
  users: User[]
}