import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Load env vars
import 'dotenv/config';

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  throw new Error("Missing SUPABASE_ACCESS_TOKEN in .env");
}

const sql = postgres(process.env.SUPABASE_ACCESS_TOKEN);

async function main() {
  console.log("Reiniciando DB de Supabase...");

  try {
    const seedFilePath = path.join(process.cwd(), 'backend_seed.sql');
    const seedScript = fs.readFileSync(seedFilePath, 'utf8');

    // Run the entire seed script
    await sql.unsafe(seedScript);

    console.log("¡Hecho! Schema y especialistas insertados en Supabase.");
  } catch (error) {
    console.error("Error al correr seed:", error);
  } finally {
    await sql.end();
  }
}

main().catch(console.error);
