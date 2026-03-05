import { createTool } from '@mastra/core/tools';
import pg from 'pg';
import { z } from 'zod';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const opmsaUpdateRequestStatusTool = createTool({
  id: 'opmsa-update-request-status',
  description: 'Actualiza el estado de una solicitud de turno en demo_requests.',
  inputSchema: z.object({
    requestId: z.string().describe('ID de la solicitud (UUID)'),
    nuevoEstado: z.enum(['RECIBIDO', 'PENDIENTE VALIDACION', 'TURNO CONFIRMADO', 'REPROGRAMADO', 'CANCELADO', 'SIN RESPUESTA', 'URGENCIA']).describe('Nuevo estado válido'),
  }),
  execute: async ({ requestId, nuevoEstado }) => {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE demo_requests SET status = $1 WHERE id = $2`,
        [nuevoEstado, requestId]
      );
      return { success: true, requestId, nuevoEstado, message: `Estado actualizado a ${nuevoEstado} con éxito.` };
    } catch (error: any) {
      console.error('Error updating status:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  },
});
