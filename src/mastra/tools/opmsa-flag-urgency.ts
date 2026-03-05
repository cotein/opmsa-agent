import { createTool } from '@mastra/core/tools';
import pg from 'pg';
import { z } from 'zod';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const opmsaFlagUrgencyTool = createTool({
  id: 'opmsa-flag-urgency',
  description: 'Marca una conversación como urgencia dental y guarda el contacto.',
  inputSchema: z.object({
    phone: z.string().describe('Teléfono del paciente'),
    reason: z.string().describe('Motivo de la urgencia'),
  }),
  execute: async ({ phone, reason }) => {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO demo_pedidos (telefono, motivo, estado, especialidad, nombre, dni, obra_social, es_nuevo)
         VALUES ($1, $2, 'urgencia', 'Urgencia', 'Paciente Urgencia', '0', 'N/A', false)`,
        [phone, reason]
      );
      return { success: true, message: 'Urgencia marcada y guardada.' };
    } catch (error: any) {
      console.error('Error flagging urgency:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  },
});
