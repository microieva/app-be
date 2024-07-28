import { dataSource } from "../configurations/db.config"

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
}

export interface AppContext {
    me: any,
    dataSource?: typeof dataSource
  }

export type DateTime = import('luxon').DateTime
