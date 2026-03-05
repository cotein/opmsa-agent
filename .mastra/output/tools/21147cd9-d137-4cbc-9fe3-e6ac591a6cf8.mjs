import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN);
const opmsaGetSpecialistsTool = createTool({
  id: "opmsa-get-specialists",
  description: "Lista los especialistas disponibles y sus especialidades.",
  inputSchema: z.object({}),
  execute: async () => {
    const rows = await sql`SELECT id, nombre, especialidad FROM demo_especialistas WHERE activo = true`;
    return { success: true, specialists: rows };
  }
});

export { opmsaGetSpecialistsTool };
