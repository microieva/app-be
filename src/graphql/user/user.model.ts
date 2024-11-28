import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert, ManyToOne, JoinColumn, ManyToMany, OneToMany } from "typeorm";
import bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import { UserRole } from "./user-role.model";
import { Chat } from "../chat/chat.model";
import { Message } from "../message/message.model";


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

  @ManyToOne(() => UserRole )
  @JoinColumn({ name: "userRoleId" }) 
  userRole: UserRole;

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


  @BeforeInsert()
  dateToLocalTime() {
    const created = DateTime.local().toISO({includeOffset: true})
    this.createdAt = new Date(created);
  }

  @CreateDateColumn({type:'datetime'})
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  lastLogInAt: Date;

  @Column({ type: 'datetime', nullable: true })
  lastLogOutAt: Date;

  @Column({type: 'datetime', nullable: true, default: null})
  updatedAt: Date | null;

  @ManyToMany(() => Chat, (chat) => chat.participants)
  chats: Chat[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];
}


