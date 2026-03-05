import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaUpdateRequestStatusTool = createTool({
  id: "opmsa-update-request-status",
  description: 'Actualiza el estado de una solicitud existente (ej. a "CANCELADO" o "REPROGRAMADO").',
  inputSchema: z.object({
    patientPhone: z.string().describe("El tel\xE9fono del paciente (u otro ID para ubicar su turno)"),
    newStatus: z.enum(["CANCELADO", "REPROGRAMADO"]).describe("El nuevo estado de la solicitud")
  }),
  execute: async ({ patientPhone, newStatus }) => {
    try {
      const rows = await sql`SELECT id FROM demo_requests WHERE phone = ${patientPhone} ORDER BY created_at DESC LIMIT 1`;
      if (!rows || rows.length === 0) {
        return { success: false, message: "No se encontr\xF3 ninguna solicitud reciente para este n\xFAmero." };
      }
      const requestId = rows[0].id;
      await sql`UPDATE demo_requests SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP WHERE id = ${requestId}`;
      return { success: true, requestId, newStatus, message: `Estado actualizado a ${newStatus} con \xE9xito.` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

export { opmsaUpdateRequestStatusTool };
