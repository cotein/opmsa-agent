const { createClient } = require('@libsql/client');

async function test() {
  const client = createClient({
    url: 'file:/home/coto/Github/Kaiahub.ar/opmsa-demo/mastra.db'
  });
  console.log("Conectado");
  const result = await client.execute('SELECT id, nombre, especialidad FROM demo_especialistas WHERE activo = true');
  console.log(result.rows);
}

test().catch(console.error);
