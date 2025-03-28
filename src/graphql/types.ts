import { devDataSource } from "src/configurations/dev-db.config";
import { User } from "./user/user.model";
import { prodDataSource } from "src/configurations/prod-db.config";
import { Server } from "socket.io";

export interface MutationResponse {
    success: boolean
    message: string | null 
}
export type LoginResponse = LoginSuccess | LoginFailure

export interface LoginSuccess {
    token: string
    expiresAt: string
}
export interface LoginFailure {
    message: string
}
export interface NextAppointmentResponse {
    nextId: number
    nextStart: string
    nextEnd: string
    previousAppointmentDate: string
    recordIds: number[]
    patient: User
    doctor: User
}

export interface AppContext {
    me: {userId: number},
    dataSource: typeof devDataSource | typeof prodDataSource, 
    io: Server
}

export type DateTime = import('luxon').DateTime

