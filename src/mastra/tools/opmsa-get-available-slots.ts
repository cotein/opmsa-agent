import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';
import 'dotenv/config';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN as string);

export const opmsaGetAvailableSlotsTool = createTool({
  id: 'opmsa-get-available-slots',
  description: 'Calcula los turnos de 30 minutos disponibles para un especialista en los próximos días.',
  inputSchema: z.object({
    especialistaId: z.string().describe('ID del odontólogo'),
    diasVista: z.number().default(4).describe('Cuántos días hacia adelante buscar (máx 7)'),
  }),
  execute: async ({ especialistaId, diasVista }) => {
    const HORA_INICIO = 9; // 09:00 local
    const HORA_FIN = 18;    // 18:00 local
    const INTERVALO = 30;   // minutos

    const slotsFinales: { fecha: string; horas: string[] }[] = [];
    const ahora = new Date();

    const fechaLimite = new Date(ahora.getTime());
    fechaLimite.setDate(ahora.getDate() + diasVista);

    // Queries en Postgres
    const result = await sql`SELECT fecha_hora
       FROM demo_agenda 
       WHERE especialista_id = ${especialistaId} 
       AND fecha_hora >= ${ahora} 
       AND fecha_hora <= ${fechaLimite}
       AND estado IN ('reservado', 'confirmado')`;
    
    // Convertimos a TimeStamps. Postgres nos devuelve JS Date validos.
    const ocupadosMap = new Set(result.map(r => new Date(r.fecha_hora).getTime()));

    // Generar slots día por día
    for (let i = 0; i <= diasVista; i++) {
        const diaBusqueda = new Date(ahora.getTime());
        diaBusqueda.setDate(ahora.getDate() + i);
        
        if (diaBusqueda.getDay() === 0) continue; // Saltea domingos estrictamente

        const pad = (n: number) => n.toString().padStart(2, '0');
        const fechaKey = `${diaBusqueda.getFullYear()}-${pad(diaBusqueda.getMonth() + 1)}-${pad(diaBusqueda.getDate())}`;
        
        const horasLibresDelDia: string[] = [];

        let cursor = new Date(diaBusqueda);
        cursor.setHours(HORA_INICIO, 0, 0, 0); 

        const finJornada = new Date(diaBusqueda);
        finJornada.setHours(HORA_FIN, 0, 0, 0); 

        while (cursor < finJornada) {
            // Evaluamos horas a futuro y si están en PostgreSQL
            if (cursor > ahora && !ocupadosMap.has(cursor.getTime())) {
                const horaLocal = `${pad(cursor.getHours())}:${pad(cursor.getMinutes())}`;
                horasLibresDelDia.push(horaLocal);
            }
            cursor.setMinutes(cursor.getMinutes() + INTERVALO);
        }

        if (horasLibresDelDia.length > 0) {
            slotsFinales.push({ fecha: fechaKey, horas: horasLibresDelDia });
        }
    }

    return {
      success: true,
      disponibilidad: slotsFinales,
      count: slotsFinales.reduce((acc, curr) => acc + curr.horas.length, 0)
    };
  },
});
