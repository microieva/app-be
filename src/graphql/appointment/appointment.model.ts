import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../user/user.model";
import { DateTime } from "luxon";

@Entity()
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    patientId: number;

    @ManyToOne(() => User, user => user.patientAppointments)
    @JoinColumn({ name: "patientId" }) 
    patient: User;

    @Column({ default: null })
    doctorId: number;

    @ManyToOne(() => User, user => user.doctorAppointments)
    @JoinColumn({ name: "doctorId" }) 
    doctor: User;

    @CreateDateColumn({type:'datetime'})
    createdAt: Date;

    @BeforeInsert()
    dateToLocalTime() {
        this.createdAt = DateTime.local().toJSDate();
    }

    @UpdateDateColumn({type: 'datetime', nullable: true})
    updatedAt: Date;

    @Column({ type: 'datetime' })
    start: Date;

    @Column({ type: 'datetime' })
    end: Date;

    @Column({ default: false })
    allDay: boolean;
}