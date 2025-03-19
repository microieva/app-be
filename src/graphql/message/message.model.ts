import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, BeforeInsert } from 'typeorm';
import { Chat } from '../chat/chat.model';
import { User } from '../user/user.model';
import { DateTime } from 'luxon';


@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn({type:'timestamp'})
  createdAt: Date;

  @BeforeInsert()
  dateToLocalTime() {
    const created = DateTime.local().toISO();
    this.createdAt = new Date(created);
  }

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
  chat: Chat;

  @ManyToOne(() => User, (user) => user.sentMessages, { eager: true })
  sender: User;
}
