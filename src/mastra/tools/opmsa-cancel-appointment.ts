import { createTool } from '@mastra/core/tools';
import pg from 'pg';
import { z } from 'zod';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const opmsaCancelAppointmentTool = createTool({
  id: 'opmsa-cancel-appointment',
  description: 'Cancela un turno existente en la agenda.',
  inputSchema: z.object({
    appointmentId: z.string().describe('ID del turno a cancelar'),
  }),
  execute: async ({ appointmentId }) => {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE demo_agenda SET estado = 'cancelado' WHERE id = $1`,
        [appointmentId]
      );
      return { success: true, message: 'Turno cancelado exitosamente' };
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  },
});
