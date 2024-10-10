import { Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { User } from "../user/user.model";
import { Message } from "../message/message.model";

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(() => User, (user) => user.chats)
  @JoinTable() // Only one side of the relationship should have @JoinTable
  participants: User[];

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];
}