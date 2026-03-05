import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN as string);

async function createTables() {
  try {
    console.log('Creating demo_sesiones_chat table...');
    await sql`
      CREATE TABLE IF NOT EXISTS public.demo_sesiones_chat (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_telefono TEXT,
        estado_actual TEXT NOT NULL,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('Creating demo_eventos_chat table...');
    await sql`
      CREATE TABLE IF NOT EXISTS public.demo_eventos_chat (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sesion_id UUID REFERENCES public.demo_sesiones_chat(id) ON DELETE CASCADE,
        estado_anterior TEXT,
        nuevo_estado TEXT NOT NULL,
        detalles JSONB,
        fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('Tables created successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await sql.end();
  }
}

createTables();
