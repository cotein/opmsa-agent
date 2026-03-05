import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:mastra.db',
});

async function run() {
  const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  for (const row of result.rows) {
    console.log(`Table: ${row.name}`);
  }
}
run();
