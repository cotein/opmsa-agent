import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaCancelAppointmentTool = createTool({
  id: "opmsa-cancel-appointment",
  description: "Cancela un turno existente dado su ID.",
  inputSchema: z.object({
    appointmentId: z.string().uuid().describe("El ID (UUID) del turno a cancelar")
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
        return { success: false, message: "No se encontr\xF3 el turno especificado." };
      }
      return { success: true, message: "Turno cancelado exitosamente." };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

export { opmsaCancelAppointmentTool };
