import { createClient } from '@libsql/client';
import { randomUUID } from 'crypto';

const client = createClient({
  url: 'file:mastra.db',
});

async function run() {
  console.log('Creating tables...');
  
  await client.execute(`
    CREATE TABLE IF NOT EXISTS demo_especialistas (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      especialidad TEXT NOT NULL,
      activo BOOLEAN DEFAULT true
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS demo_agenda (
      id TEXT PRIMARY KEY,
      especialista_id TEXT NOT NULL,
      paciente_id TEXT NOT NULL,
      fecha_hora TEXT NOT NULL,
      estado TEXT NOT NULL,
      notas TEXT
    )
  `);

  console.log('Checking for existing specialists...');
  const result = await client.execute('SELECT COUNT(*) as count FROM demo_especialistas');
  const count = result.rows[0].count;

  if (count === 0 || count === 0n) {
    console.log('Inserting mock specialists...');
    const id1 = randomUUID();
    const id2 = randomUUID();
    await client.execute({
      sql: 'INSERT INTO demo_especialistas (id, nombre, especialidad, activo) VALUES (?, ?, ?, ?)',
      args: [id1, 'Dr. Juan Pérez', 'Cardiología', true]
    });
    await client.execute({
      sql: 'INSERT INTO demo_especialistas (id, nombre, especialidad, activo) VALUES (?, ?, ?, ?)',
      args: [id2, 'Dra. Ana Gómez', 'Odontología', true]
    });
    console.log('Inserted.');
  } else {
    console.log('Specialists already exist.');
  }

  console.log('Database setup complete.');
}

run().catch(console.error);
