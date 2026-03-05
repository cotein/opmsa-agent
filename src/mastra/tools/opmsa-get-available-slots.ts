import { createTool } from '@mastra/core/tools';
import pg from 'pg';
import { z } from 'zod';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

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

    const client = await pool.connect();
    try {
      // Queries en Postgres usando pg
      const result = await client.query(
        `SELECT fecha_hora
         FROM demo_agenda 
         WHERE especialista_id = $1 
         AND fecha_hora >= $2 
         AND fecha_hora <= $3
         AND estado IN ('reservado', 'confirmado')`,
        [especialistaId, ahora, fechaLimite]
      );
      
      const ocupadosMap = new Set(result.rows.map(r => new Date(r.fecha_hora).getTime()));

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
    } finally {
      client.release();
    }
  },
});
