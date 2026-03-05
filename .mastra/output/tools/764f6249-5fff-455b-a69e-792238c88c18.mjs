import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaFlagUrgencyTool = createTool({
  id: "opmsa-flag-urgency",
  description: "Marca una interacci\xF3n como URGENCIA para que sea atendida inmediatamente por un operador humano.",
  inputSchema: z.object({
    patientPhone: z.string().describe("El tel\xE9fono del paciente"),
    urgencyDescription: z.string().describe("Descripci\xF3n breve de la urgencia m\xE9dica")
  }),
  execute: async ({ patientPhone, urgencyDescription }) => {
    try {
      await sql`INSERT INTO demo_requests 
              (phone, full_name, reason, status)
              VALUES (${patientPhone}, 'URGENCIA NO IDENTIFICADA', ${urgencyDescription}, 'URGENCIA')`;
      console.log(`[URGENCIA DETECTADA] Paciente ${patientPhone} reporta: ${urgencyDescription}`);
      return {
        success: true,
        message: "Urgencia registrada y operador notificado. Dile al paciente que aguarde un momento en l\xEDnea."
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

export { opmsaFlagUrgencyTool };
