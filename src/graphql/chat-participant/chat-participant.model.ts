import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from "typeorm";
import { Chat } from "../chat/chat.model";
import { User } from "../user/user.model";

@Entity()
export class ChatParticipant {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Chat, (chat) => chat.participants)
    @JoinColumn({ name: 'chatId' }) 
    chat: Chat;

    @ManyToOne(() => User, (user) => user.chats)
    @JoinColumn({ name: 'participantId' })
    participant: User;

    @Column({ type:'datetime', nullable: true })
    deletedAt: Date | null; 
}

