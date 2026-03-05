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
  description: 'Reserva un turno en la base de datos (demo_agenda), creando al paciente si no existe.',
  inputSchema: z.object({
    especialistaId: z.string().describe('ID del odontólogo (UUID)'),
    pacienteNombre: z.string().describe('Nombre completo del paciente'),
    pacienteTelefono: z.string().describe('Teléfono del paciente'),
    pacienteEmail: z.string().optional().describe('Email del paciente'),
    obraSocial: z.string().optional().describe('Obra social del paciente'),
    fechaHora: z.string().describe('Fecha y hora en formato ISO'),
    notas: z.string().optional().describe('Notas adicionales'),
  }),
  execute: async ({ especialistaId, pacienteNombre, pacienteTelefono, pacienteEmail, obraSocial, fechaHora, notas }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Buscar o Crear Paciente
      let pacienteId;
      const patientRes = await client.query(
        'SELECT id FROM demo_pacientes WHERE telefono = $1 LIMIT 1',
        [pacienteTelefono]
      );

      if (patientRes.rows.length > 0) {
        pacienteId = patientRes.rows[0].id;
      } else {
        const newPatient = await client.query(
          `INSERT INTO demo_pacientes (nombre_completo, telefono, email, obra_social)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [pacienteNombre, pacienteTelefono, pacienteEmail || '', obraSocial || '']
        );
        pacienteId = newPatient.rows[0].id;
      }

      // 2. Insertar Turno en Agenda
      const res = await client.query(
        `INSERT INTO demo_agenda (especialista_id, paciente_id, fecha_hora, duracion_minutos, estado, notas)
         VALUES ($1, $2, $3, $4, 'reservado', $5)
         RETURNING id`,
        [especialistaId, pacienteId, fechaHora, 30, notas || '']
      );

      await client.query('COMMIT');
      
      return {
        success: true,
        appointmentId: res.rows[0].id,
        message: 'Turno reservado exitosamente',
      };
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error booking appointment:', error);
      return { success: false, message: error.message };
    } finally {
      client.release();
    }
  },
});