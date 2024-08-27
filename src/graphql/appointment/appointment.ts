import { User } from "../user/user.model"

export interface Appointment {
    id: number
    doctorId?: number
    patientId: number
    updatedAt?: string
    end: string
    start: string
    allDay: boolean
    patient: User
    doctor: User
}