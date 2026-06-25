import pg from 'pg';
const {Client} = pg;
const c = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Uw18kNsfFSMV@ep-gentle-river-atrldetf.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});
c.connect().then(async () => {
  try {
    const r = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('Tables:', r.rows.map(r => r.table_name).join(', '));

    const wo = await c.query("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'WorkOrder' ORDER BY ordinal_position");
    console.log('WorkOrder columns:', JSON.stringify(wo.rows));

    const rowCount = await c.query("SELECT COUNT(*) FROM \"WorkOrder\"");
    console.log('WorkOrder rows:', rowCount.rows[0].count);
  } catch (e) {
    console.error('Error:', e.message.split('\n')[0]);
  }
  await c.end();
}).catch(e => console.error(e.message));
