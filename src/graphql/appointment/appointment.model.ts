import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../user/user.model";

@Entity()
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    customerId: number;

    @ManyToOne(() => User, user => user.patientAppointments)
    @JoinColumn({ name: "customerId" }) 
    customer: User;

    @Column({ default: null })
    doctorId: number;

    @ManyToOne(() => User, user => user.doctorAppointments)
    @JoinColumn({ name: "doctorId" }) 
    doctor: User;

    @CreateDateColumn({type:'date'})
    createdAt: Date;

    @UpdateDateColumn({type: 'date', nullable: true})
    updatedAt: Date;
}