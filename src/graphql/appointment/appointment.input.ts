export interface AppointmentInput {
    id?: number
    start: string
    end: string
    allDay: boolean
    patientMessage: string
    doctorMessage: string
}