import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, BeforeInsert } from 'typeorm';
import { Chat } from '../chat/chat.model';
import { User } from '../user/user.model';
import { getNow } from '../utils';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn({type:'datetime'})
  createdAt: Date;

  @BeforeInsert()
  dateToLocalTime() {
    this.createdAt = getNow();
  }

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
  chat: Chat;

  @ManyToOne(() => User, (user) => user.sentMessages, { eager: true })
  sender: User;
}
