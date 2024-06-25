import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, BeforeInsert } from "typeorm";
import bcrypt from "bcryptjs";
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
  @OneToOne(() => UserRole, role => role.userRole)
  userRoleId: number;

  @OneToOne(() => UserRole, userRole => userRole.userRole)
  @JoinColumn({ name: "userRoleId" }) 
  userRole: string;

  @Column({nullable: false })
  phone: number;

  @Column({nullable: false })
  email: string;

  @Column({nullable: true })
  password: string;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  @Column({type: 'date', nullable: false})
  dob: Date;

  @Column({ length: 100, nullable: true })
  streetAddress: string;

  @Column({ length: 25, nullable: true })
  city: string;

  @Column({ nullable: true })
  postCode: number;

  @CreateDateColumn({type:'date'})
  createdAt: Date;

  @Column({ type: 'date', nullable: true })
  lastLogInAt: Date;
}


