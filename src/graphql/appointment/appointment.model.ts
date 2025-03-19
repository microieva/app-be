import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../user/user.model";
import { Record } from "../record/record.model";
import { getNow } from "../utils";

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

    @CreateDateColumn({type:'timestamp'})
    createdAt: Date;

    @BeforeInsert()
    dateToLocalTime() {
        this.createdAt  = getNow();
        this.updatedAt = getNow();
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

    @OneToOne(() => Record, record => record.appointment, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "recordId"})
    record: Record;
    

    @Column({ default: null, nullable: true })
    recordId: number;
}