import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
//import { User } from "./user.model";

@Entity()
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userRole: string;
  
  // @OneToMany(()=> User, user => user.userRole)
  // users: User[]
}