export interface Appointment {
    id: number
    doctorId?: number
    customerId: number
    updatedAt?: string
    customerNotes?: string
    doctorNoted?: string
    //medicalRedords: MedicalRecord[]
}