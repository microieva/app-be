//import { Date } from 'luxon';

export interface UserInput {
    id?: number
    firstName: string
    lastName: string
    userRole: string
    phone: number
    email: string
    password?: string
    dob: Date
    streetAddress?: string
    city?: string
    postCode?: number
}