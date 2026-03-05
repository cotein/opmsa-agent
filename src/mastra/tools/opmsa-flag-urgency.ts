import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';
import 'dotenv/config';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN as string);

export const opmsaFlagUrgencyTool = createTool({
  id: 'opmsa-flag-urgency',
  description: 'Marca una interacción como URGENCIA para que sea atendida inmediatamente por un operador humano.',
  inputSchema: z.object({
    patientPhone: z.string().describe('El teléfono del paciente'),
    urgencyDescription: z.string().describe('Descripción breve de la urgencia médica'),
  }),
  execute: async ({ patientPhone, urgencyDescription }) => {
    try {
      await sql`INSERT INTO demo_requests 
              (phone, full_name, reason, status)
              VALUES (${patientPhone}, 'URGENCIA NO IDENTIFICADA', ${urgencyDescription}, 'URGENCIA')`;

      // Here you would typically integrate with an SMS gateway, Slack hook, or Email API to alert the operator immediately.
      console.log(`[URGENCIA DETECTADA] Paciente ${patientPhone} reporta: ${urgencyDescription}`);

      return { 
        success: true, 
        message: 'Urgencia registrada y operador notificado. Dile al paciente que aguarde un momento en línea.' 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
