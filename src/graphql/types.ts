export interface MutationResponse {
    success: boolean,
    message: string | null 
}

export interface AppContext {
    authScope?: string;
    str: string
  }