import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from "typeorm";
import { UserRole } from "./user-role.model";


@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({length: 15, nullable: false })
  firstName: string;

  @Column({length: 25, nullable: false })
  lastName: string;

  @Column()
  @OneToOne(() => UserRole, role => role.id)
  userRoleId: number;

  @Column({nullable: false })
  phone: number;

  @Column({nullable: false })
  email: string;

  @Column({nullable: true })
  password: string;

  @Column({type: 'date', nullable: false})
  dob: Date;

  @Column({ length: 100, nullable: true })
  streetAddress?: string;

  @Column({ length: 25, nullable: true })
  city?: string;

  @Column({ length: 6, nullable: true })
  postCode?: number;

  @CreateDateColumn({type:'date'})
  createdAt: Date

  @Column({ type: 'date', nullable: true , default: (createdAt: Date)=> createdAt})
  lastLoginAt: Date;
}

