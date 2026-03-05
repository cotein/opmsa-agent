import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaBookAppointmentTool = createTool({
  id: "opmsa-book-appointment",
  description: "Reserva un turno para un paciente en la agenda.",
  inputSchema: z.object({
    especialistaId: z.string().uuid(),
    pacienteNombre: z.string().describe("El nombre completo del paciente"),
    pacienteTelefono: z.string().describe("El tel\xE9fono del paciente"),
    pacienteId: z.string().uuid().optional().describe("El ID del prospecto/paciente actual, provisto por el sistema"),
    fechaHora: z.string().describe("Formato ISO string del slot elegido"),
    notas: z.string().optional()
  }),
  execute: async ({ especialistaId, pacienteNombre, pacienteTelefono, pacienteId, fechaHora, notas }) => {
    try {
      console.log(`[BOOK_APPOINTMENT] Executing for paciente: ${pacienteNombre}, id: ${pacienteId}, tel: ${pacienteTelefono}`);
      let finalPacienteId = pacienteId || "";
      if (finalPacienteId) {
        await sql`
          UPDATE demo_pacientes 
          SET nombre_completo = ${pacienteNombre}, telefono = ${pacienteTelefono}
          WHERE id = ${finalPacienteId}
        `;
      } else {
        const pacienteRows = await sql`SELECT id FROM demo_pacientes WHERE telefono = ${pacienteTelefono}`;
        if (pacienteRows && pacienteRows.length > 0) {
          finalPacienteId = pacienteRows[0].id;
          await sql`UPDATE demo_pacientes SET nombre_completo = ${pacienteNombre} WHERE id = ${finalPacienteId}`;
        } else {
          const insertRows = await sql`INSERT INTO demo_pacientes (nombre_completo, telefono) VALUES (${pacienteNombre}, ${pacienteTelefono}) RETURNING id`;
          finalPacienteId = insertRows[0].id;
        }
      }
      await sql`
         INSERT INTO demo_agenda (especialista_id, paciente_id, fecha_hora, estado, notas)
         VALUES (${especialistaId}, ${finalPacienteId}, ${fechaHora}, 'reservado', ${notas ?? null})
         ON CONFLICT (especialista_id, fecha_hora)
         DO UPDATE SET 
            paciente_id = EXCLUDED.paciente_id, 
            estado = EXCLUDED.estado, 
            notas = EXCLUDED.notas
      `;
      return { success: true, message: "Turno reservado con \xE9xito" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

export { opmsaBookAppointmentTool };
