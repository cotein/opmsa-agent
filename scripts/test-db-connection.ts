import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:/home/coto/Github/Kaiahub.ar/opmsa-demo/mastra.db',
});

async function main() {
  const ahora = new Date();
  
  const offset = -3; 
  ahora.setHours(ahora.getHours() + offset);

  const sql = `SELECT fecha_hora
       FROM demo_agenda`;
       
  const res = await client.execute(sql);
  console.log("DB RAW RESULTS (sin filtro de fecha):", res.rows);
}

main().catch(console.error);
