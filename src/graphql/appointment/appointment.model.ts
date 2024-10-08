import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { DateTime } from "luxon";
import { User } from "../user/user.model";
import { Record } from "../record/record.model";

@Entity()
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: null, nullable: true })
    patientId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "patientId" }) 
    patient: User;

    @Column({ default: null, nullable: true })
    doctorId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "doctorId" }) 
    doctor: User;

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

    @Column({ type: 'datetime' })
    start: Date;

    @Column({ type: 'datetime' })
    end: Date;

    @Column({ default: false })
    allDay: boolean;

    @Column({ default: null, type: "nvarchar", length: 700})
    patientMessage: string;

    @Column({ default: null, type: "nvarchar", length: 700})
    doctorMessage: string;

    @OneToOne(() => Record, record => record.appointment)
    record: Record;
}