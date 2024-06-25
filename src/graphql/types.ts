import { dataSource } from "../configurations/db.config"

export interface MutationResponse {
    success: boolean
    message: string | null 
}

export interface AppContext {
    user: any,
    dataSource?: typeof dataSource
  }

export type DateTime = import('luxon').DateTime
