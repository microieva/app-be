import { User } from "../user/user";
import { Message } from "../message/message";

export interface Chat {
  id: number,
  participants: User[];
  messages: Message[];
}