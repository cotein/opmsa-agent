import { createTool } from '@mastra/core/tools';
import pg from 'pg';
import { z } from 'zod';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const opmsaGetPatientAppointmentsTool = createTool({
  id: 'opmsa-get-patient-appointments',
  description: 'Busca los turnos activos de un paciente por su número de teléfono.',
  inputSchema: z.object({
    phone: z.string().describe('Teléfono del paciente'),
  }),
  execute: async ({ phone }) => {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT a.id, a.fecha_hora, e.nombre as especialista, e.especialidad
         FROM demo_agenda a
         JOIN demo_especialistas e ON a.especialista_id = e.id
         WHERE a.paciente_telefono = $1 AND a.fecha_hora >= NOW() AND a.estado = 'reservado'
         ORDER BY a.fecha_hora ASC`,
        [phone]
      );
      return { success: true, appointments: res.rows };
    } catch (error: any) {
      console.error('Error fetching patient appointments:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  },
});
