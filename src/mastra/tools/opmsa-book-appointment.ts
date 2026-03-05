import { createTool } from '@mastra/core/tools';
import pg from 'pg';
import { z } from 'zod';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const opmsaBookAppointmentTool = createTool({
  id: 'opmsa-book-appointment',
  description: 'Reserva un turno en la base de datos.',
  inputSchema: z.object({
    especialistaId: z.string().describe('ID del odontólogo'),
    pacienteNombre: z.string().describe('Nombre del paciente'),
    pacienteTelefono: z.string().describe('Teléfono del paciente'),
    fechaHora: z.string().describe('Fecha y hora en formato ISO'),
    notas: z.string().optional().describe('Notas adicionales'),
  }),
  execute: async ({ especialistaId, pacienteNombre, pacienteTelefono, fechaHora, notas }) => {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `INSERT INTO demo_agenda (especialista_id, paciente_nombre, paciente_telefono, fecha_hora, notas, estado)
         VALUES ($1, $2, $3, $4, $5, 'reservado')
         RETURNING id`,
        [especialistaId, pacienteNombre, pacienteTelefono, fechaHora, notas || '']
      );
      
      return {
        success: true,
        appointmentId: res.rows[0].id,
        message: 'Turno reservado exitosamente',
      };
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  },
});