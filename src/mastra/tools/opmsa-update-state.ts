import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';
import 'dotenv/config';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN as string);

export const opmsaUpdateStateTool = createTool({
  id: 'opmsa-update-state',
  description: 'Actualiza el estado de la conversación del paciente y guarda un registro en el historial para auditoría.',
  inputSchema: z.object({
    pacienteTelefono: z.string().describe('El teléfono del paciente como identificador de la sesión.'),
    nuevoEstado: z.enum([
      'INICIADO',
      'IDENTIFICACION',
      'ESPERANDO_DATOS',
      'OFERTA_TURNOS',
      'EXITO_AGENDADO',
      'DERIVADO_URGENCIA',
      'ABANDONADO'
    ]).describe('El nuevo estado de la conversación.'),
    detalles: z.string().optional().describe('Detalles adicionales sobre el cambio de estado (ej. herramienta ejecutada o notas adicionales).'),
  }),
  execute: async ({ pacienteTelefono, nuevoEstado, detalles }) => {
    try {
      // 1. Find the latest active session for this phone number, or create one if it doesn't exist.
      // We consider a session active if it was updated in the last 12 hours and doesn't have an end state.
      let sesionResult = await sql`
        SELECT id, estado_actual 
        FROM demo_sesiones_chat 
        WHERE paciente_telefono = ${pacienteTelefono} 
          AND actualizado_en > NOW() - INTERVAL '12 hours' 
        ORDER BY actualizado_en DESC 
        LIMIT 1
      `;
      
      let sesionId = '';
      let estadoAnterior = null;

      if (sesionResult && sesionResult.length > 0) {
        sesionId = sesionResult[0].id as string;
        estadoAnterior = sesionResult[0].estado_actual as string;
        
        // Update the existing session
        await sql`
          UPDATE demo_sesiones_chat 
          SET estado_actual = ${nuevoEstado}, actualizado_en = NOW() 
          WHERE id = ${sesionId}
        `;
      } else {
        // Create a new session
        const insertRows = await sql`
          INSERT INTO demo_sesiones_chat (paciente_telefono, estado_actual) 
          VALUES (${pacienteTelefono}, ${nuevoEstado}) 
          RETURNING id
        `;
        sesionId = insertRows[0].id as string;
      }

      // 2. Insert the transition event
      const detallesObj = detalles ? JSON.stringify({ nota: detalles }) : null;
      await sql`
        INSERT INTO demo_eventos_chat (sesion_id, estado_anterior, nuevo_estado, detalles)
        VALUES (${sesionId}, ${estadoAnterior}, ${nuevoEstado}, ${detallesObj})
      `;

      return { success: true, message: `Estado actualizado a ${nuevoEstado} exitosamente.` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
