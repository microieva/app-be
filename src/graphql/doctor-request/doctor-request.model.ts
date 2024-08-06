import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class DoctorRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable: false })
  email: string;

  @Column({length: 15, nullable: false })
  firstName: string;

  @Column({length: 25, nullable: false })
  lastName: string;

  @Column()
  userRoleId: number;

  @UpdateDateColumn({type: 'date', nullable: true})
  updatedAt: Date;

  @CreateDateColumn({type:'date'})
  createdAt: Date;
}