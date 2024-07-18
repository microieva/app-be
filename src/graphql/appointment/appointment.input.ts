export interface AppointmentInput {
    id?: number
    // doctorId?: number
    // patientId: number
    // updatedAt?: string
    start: string
    end: string
    allDay: boolean
    //customerNotes?: string
    //doctorNoted?: string
    //medicalRedords: MedicalRecord[]
}