import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  await client.query('ALTER TABLE "User" ADD COLUMN "rut" TEXT UNIQUE;');
  await client.query('ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;');
  console.log("Schema updated successfully.");
} catch (e) {
  console.error("Error updating schema:", e);
} finally {
  await client.end();
}
