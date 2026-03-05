import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';
import 'dotenv/config';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN as string);

export const opmsaGetPatientAppointmentsTool = createTool({
  id: 'opmsa-get-patient-appointments',
  description: 'Busca y lista los turnos activos (reservados o confirmados) de un paciente.',
  inputSchema: z.object({
    telefono: z.string().describe('El teléfono del paciente para buscar sus turnos'),
  }),
  execute: async ({ telefono }) => {
    try {
      const turnos = await sql`
        SELECT 
          a.id as appointment_id,
          a.fecha_hora,
          a.estado,
          e.nombre as especialista,
          e.especialidad
        FROM demo_agenda a
        JOIN demo_pacientes p ON a.paciente_id = p.id
        JOIN demo_especialistas e ON a.especialista_id = e.id
        WHERE p.telefono = ${telefono}
          AND a.estado IN ('reservado', 'confirmado')
        ORDER BY a.fecha_hora ASC
      `;

      if (turnos.length === 0) {
        return { success: true, turnos: [], message: 'No se encontraron turnos activos para este teléfono.' };
      }

      return { 
        success: true, 
        turnos: turnos.map(t => ({
          id: t.appointment_id,
          fecha: new Date(t.fecha_hora).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
          especialista: t.especialista,
          especialidad: t.especialidad,
          estado: t.estado
        }))
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
