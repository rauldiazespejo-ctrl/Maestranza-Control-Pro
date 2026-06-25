import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Uw18kNsfFSMV@ep-gentle-river-atrldetf.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected');

  const enums = ['UserRole', 'WorkOrderStatus', 'Priority', 'HseqType', 'Norm', 'HseqStatus'];
  for (const name of enums) {
    const r = await client.query(`SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = $1) ORDER BY enumsortorder`, [name.toLowerCase()]);
    console.log(`${name}: [${r.rows.map(r => r.enumlabel).join(', ')}]`);
  }

  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
