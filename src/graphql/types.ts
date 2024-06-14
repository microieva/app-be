//import { AppDataSource } from "../configurations/db.config"

export interface MutationResponse {
    success: boolean
    message: string | null 
}

export interface AppContext {
    authScope?: string
    //dataSource: typeof AppDataSource
    myStr: string
  }