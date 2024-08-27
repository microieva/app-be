import { Appointment } from "../appointment/appointment.model"

export interface Record {
    id: number
    title: string
    text: string
    createdAt: string
    updatedAt: string
    appointment: Appointment
    draft: boolean
}