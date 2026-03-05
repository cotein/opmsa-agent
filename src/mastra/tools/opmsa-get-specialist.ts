import { createTool } from '@mastra/core/tools';
import postgres from 'postgres';
import { z } from 'zod';
import 'dotenv/config';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN as string);

// 2. Tool: Obtener Especialistas (Para que el agente sepa quiénes trabajan hoy)
export const opmsaGetSpecialistsTool = createTool({
  id: 'opmsa-get-specialists',
  description: 'Lista los especialistas disponibles y sus especialidades.',
  inputSchema: z.object({}),
  execute: async () => {
    const rows = await sql`SELECT id, nombre, especialidad FROM demo_especialistas WHERE activo = true`;
    return { success: true, specialists: rows };
  }
});