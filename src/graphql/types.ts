// import { devDataSource } from "../configurations/dev-db.config";
// import { prodDataSource } from "../configurations/prod-db.config";
import { User } from "./user/user.model";

export interface MutationResponse {
    success: boolean
    message: string | null 
}
export interface LoginResponse {
    token: string
    expiresAt: string
}
export interface NextAppointmentResponse {
    nextId: number
    nextStart: string
    nextEnd: string
    patient: User
    doctor: User
}

export interface AppContext {
    me: any,
    dataSource?: any
    io: any
}

export type DateTime = import('luxon').DateTime

