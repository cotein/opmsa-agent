import { createTool } from '@mastra/core/tools';
import pg from 'pg';
import { z } from 'zod';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const opmsaSaveRequestTool = createTool({
  id: 'opmsa-save-request',
  description: 'Guarda una solicitud de turno completa en la tabla de leads/pedidos.',
  inputSchema: z.object({
    nombre: z.string(),
    dni: z.string(),
    telefono: z.string(),
    email: z.string().optional(),
    especialidad: z.string(),
    motivo: z.string(),
    obraSocial: z.string(),
    esNuevo: z.boolean(),
  }),
  execute: async (data) => {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `INSERT INTO demo_pedidos (nombre, dni, telefono, email, especialidad, motivo, obra_social, es_nuevo, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendiente')
         RETURNING id`,
        [
          data.nombre,
          data.dni,
          data.telefono,
          data.email || '',
          data.especialidad,
          data.motivo,
          data.obraSocial,
          data.esNuevo,
        ]
      );
      
      return { success: true, requestId: res.rows[0].id };
    } catch (error: any) {
      console.error('Error saving request:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  },
});
