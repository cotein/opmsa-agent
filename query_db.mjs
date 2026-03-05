import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:mastra.db',
});

async function run() {
  const result = await client.execute("SELECT name, sql FROM sqlite_master WHERE type='table'");
  console.log("Tables:");
  for (const row of result.rows) {
    console.log(`\nTable: ${row.name}`);
    console.log(row.sql);
  }
}
run();
