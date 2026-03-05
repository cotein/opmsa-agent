import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';
import 'dotenv/config';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN as string);

export const opmsaSaveRequestTool = createTool({
  id: 'opmsa-save-request',
  description: 'Guarda una nueva solicitud de turno de un paciente con todos sus datos.',
  inputSchema: z.object({
    fullName: z.string().describe('El nombre completo del paciente'),
    dni: z.string().describe('El DNI del paciente'),
    phone: z.string().describe('El teléfono del paciente'),
    specialty: z.string().describe('La especialidad requerida'),
    reason: z.string().describe('Breve motivo de consulta'),
    timeSlot: z.string().describe('Franja horaria deseada'),
    healthInsurance: z.string().describe('Obra social o particular'),
    isNewPatient: z.boolean().describe('True si es paciente nuevo'),
  }),
  execute: async ({ fullName, dni, phone, specialty, reason, timeSlot, healthInsurance, isNewPatient }) => {
    try {
      await sql`INSERT INTO demo_requests 
              (full_name, dni, phone, specialty, reason, time_slot_requested, health_insurance, is_new_patient, status)
              VALUES (${fullName}, ${dni}, ${phone}, ${specialty}, ${reason}, ${timeSlot}, ${healthInsurance}, ${isNewPatient}, 'PENDIENTE VALIDACION')`;
      return { success: true, status: 'PENDIENTE VALIDACION', message: 'Solicitud guardada con éxito.' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
