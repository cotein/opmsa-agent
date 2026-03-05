import { createTool } from '@mastra/core/tools';
import pg from 'pg';
import { z } from 'zod';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// 2. Tool: Obtener Especialistas (Para que el agente sepa quiénes trabajan hoy)
export const opmsaGetSpecialistsTool = createTool({
  id: 'opmsa-get-specialists',
  description: 'Lista los especialistas disponibles y sus especialidades.',
  inputSchema: z.object({}),
  execute: async () => {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT id, nombre, especialidad FROM demo_especialistas WHERE activo = true');
      return { success: true, specialists: res.rows };
    } finally {
      client.release();
    }
  }
});