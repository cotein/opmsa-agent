import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaGetAvailableSlotsTool = createTool({
  id: "opmsa-get-available-slots",
  description: "Calcula los turnos de 30 minutos disponibles para un especialista en los pr\xF3ximos d\xEDas.",
  inputSchema: z.object({
    especialistaId: z.string().describe("ID del odont\xF3logo"),
    diasVista: z.number().default(4).describe("Cu\xE1ntos d\xEDas hacia adelante buscar (m\xE1x 7)")
  }),
  execute: async ({ especialistaId, diasVista }) => {
    const HORA_INICIO = 9;
    const HORA_FIN = 18;
    const INTERVALO = 30;
    const slotsFinales = [];
    const ahora = /* @__PURE__ */ new Date();
    const fechaLimite = new Date(ahora.getTime());
    fechaLimite.setDate(ahora.getDate() + diasVista);
    const result = await sql`SELECT fecha_hora
       FROM demo_agenda 
       WHERE especialista_id = ${especialistaId} 
       AND fecha_hora >= ${ahora} 
       AND fecha_hora <= ${fechaLimite}
       AND estado IN ('reservado', 'confirmado')`;
    const ocupadosMap = new Set(result.map((r) => new Date(r.fecha_hora).getTime()));
    for (let i = 0; i <= diasVista; i++) {
      const diaBusqueda = new Date(ahora.getTime());
      diaBusqueda.setDate(ahora.getDate() + i);
      if (diaBusqueda.getDay() === 0) continue;
      const pad = (n) => n.toString().padStart(2, "0");
      const fechaKey = `${diaBusqueda.getFullYear()}-${pad(diaBusqueda.getMonth() + 1)}-${pad(diaBusqueda.getDate())}`;
      const horasLibresDelDia = [];
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
  }
});

export { opmsaGetAvailableSlotsTool };
