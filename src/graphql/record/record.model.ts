import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, BeforeInsert, CreateDateColumn, UpdateDateColumn, OneToOne } from "typeorm";
import { DateTime } from "luxon";
import { Appointment } from "../appointment/appointment.model";

@Entity()
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: "nvarchar", length: 20})
  title: string;

  @Column({ nullable: true, type: "nvarchar", length: 4000})
  text: string;

  @CreateDateColumn({type:'datetime'})
  createdAt: Date;

  @BeforeInsert()
  dateToLocalTime() {
    this.createdAt = DateTime.local().toJSDate();
    this.updatedAt = DateTime.local().toJSDate();
  }

  @UpdateDateColumn({type: 'datetime', nullable: true})
  updatedAt: Date;

  @Column({ nullable: false })
  appointmentId: number;

  @OneToOne(() => Appointment, appointment => appointment.record)
  @JoinColumn({ name: 'appointmentId' }) 
  appointment: Appointment;

  @Column()
  draft: boolean;
}