import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert, ManyToOne, UpdateDateColumn, OneToMany, JoinColumn } from "typeorm";
import bcrypt from "bcryptjs";
import { UserRole } from "./user-role.model";
import { Appointment } from "../appointment/appointment.model";


@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({length: 15, nullable: false })
  firstName: string;

  @Column({length: 25, nullable: false })
  lastName: string;

  @Column()
  userRoleId: number;

  @ManyToOne(() => UserRole, userRole => userRole.userRole)
  @JoinColumn({ name: "userRole" }) 
  userRole: string;

  @Column({nullable: true })
  phone: string;

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

  @Column({type: 'date', nullable: true })
  dob: Date;

  @Column({ length: 100, nullable: true })
  streetAddress: string;

  @Column({ length: 25, nullable: true })
  city: string;

  @Column({ nullable: true })
  postCode: string;

  @CreateDateColumn({type:'date'})
  createdAt: Date;

  @Column({ type: 'date', nullable: true })
  lastLogInAt: Date;

  @UpdateDateColumn({type: 'date', nullable: true})
  updatedAt: Date;

  @OneToMany(()=> Appointment, appointment => appointment.patientId)
  patientAppointments: Appointment[]


  @OneToMany(()=> Appointment, appointment => appointment.doctorId)
  doctorAppointments: Appointment[]
}


