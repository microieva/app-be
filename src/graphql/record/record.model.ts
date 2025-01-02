import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToOne, ManyToOne, BeforeInsert } from "typeorm";
import { Appointment } from "../appointment/appointment.model";
import { User } from "../user/user.model";
import { DateTime } from "luxon";

@Entity()
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: "nvarchar", length: 50})
  title: string;

  @Column({ nullable: true, type: "nvarchar", length: 4000})
  text: string;

  @CreateDateColumn({type:'datetime'})
  createdAt: Date;

  @BeforeInsert()
    dateToLocalTime() {
        const created = DateTime.local().toISO();
        this.createdAt = new Date(created);
        const updated = DateTime.local().toISO();
        this.updatedAt = new Date(updated);
    }

  @UpdateDateColumn({type: 'datetime', nullable: true})
  updatedAt: Date;

  @Column({ nullable: true })
  appointmentId: number;

  @Column({ nullable: false })
  patientId: number;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: "patientId" }) 
  patient: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "doctorId" }) 
  doctor: User;

  @Column({ nullable: false })
  doctorId: number;

  @OneToOne(() => Appointment, appointment => appointment.record)
  @JoinColumn({ name: 'appointmentId' }) 
  appointment: Appointment;

  @Column()
  draft: boolean;
}