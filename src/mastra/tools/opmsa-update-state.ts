import { createTool } from '@mastra/core/tools';
import pg from 'pg';
import { z } from 'zod';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const opmsaUpdateStateTool = createTool({
  id: 'opmsa-update-state',
  description: 'Actualiza el estado de la conversación en la base de datos para seguimiento.',
  inputSchema: z.object({
    phone: z.string().describe('Teléfono del paciente'),
    state: z.string().describe('Nuevo estado (INICIADO, IDENTIFICACION, etc.)'),
  }),
  execute: async ({ phone, state }) => {
    const client = await pool.connect();
    try {
      // Intentar actualizar si existe el pedido más reciente para ese teléfono
      await client.query(
        `UPDATE demo_pedidos 
         SET estado_conversacion = $1 
         WHERE id = (SELECT id FROM demo_pedidos WHERE telefono = $2 ORDER BY created_at DESC LIMIT 1)`,
        [state, phone]
      );
      return { success: true };
    } catch (error: any) {
      console.error('Error updating conversation state:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  },
});
