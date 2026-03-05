import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';
import 'dotenv/config';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN as string);

export const opmsaCancelAppointmentTool = createTool({
  id: 'opmsa-cancel-appointment',
  description: 'Cancela un turno existente dado su ID.',
  inputSchema: z.object({
    appointmentId: z.string().uuid().describe('El ID (UUID) del turno a cancelar'),
  }),
  execute: async ({ appointmentId }) => {
    try {
      const result = await sql`
        UPDATE demo_agenda
        SET estado = 'cancelado', notas = concat(notas, ' [Cancelado por el paciente]')
        WHERE id = ${appointmentId}
        RETURNING id
      `;

      if (result.length === 0) {
        return { success: false, message: 'No se encontró el turno especificado.' };
      }

      return { success: true, message: 'Turno cancelado exitosamente.' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
