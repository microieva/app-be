import { DateTime } from "../types"

export interface UserInput {
    id?: number
    firstName: string
    lastName: string
    userRoleId: number
    phone: number
    email: string
    password?: string
    dob: DateTime
    streetAddress?: string
    city?: string
    postCode?: number
    lastLogInAt?: DateTime
}