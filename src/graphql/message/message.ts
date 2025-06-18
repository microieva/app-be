import {User} from "../user/user";
import {Chat} from "../chat/chat";

export interface Message {
   id: number;
    content: string;
    isRead: boolean;
    createdAt: Date;
    chat: Chat;
    sender: User;
}