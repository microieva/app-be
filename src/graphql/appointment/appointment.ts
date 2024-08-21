export interface Appointment {
    id: number
    doctorId?: number
    patientId: number
    updatedAt?: string
    end: string
    start: string
    allDay: boolean
}