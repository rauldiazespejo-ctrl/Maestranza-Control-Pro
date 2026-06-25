import pg from 'pg';
const {Client} = pg;
const c = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Uw18kNsfFSMV@ep-gentle-river-atrldetf.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});
c.connect().then(async () => {
  // Check which tables have which columns
  const tablesWithEnumCols = {
    'WorkOrder': ['status', 'priority'],
    'HseqRecord': ['type', 'norm', 'status'],
  };

  for (const [table, cols] of Object.entries(tablesWithEnumCols)) {
    const existing = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [table]);
    const existingCols = existing.rows.map(r => r.column_name);
    for (const col of cols) {
      if (!existingCols.includes(col)) {
        const typeMap = { status: table === 'HseqRecord' ? 'HseqStatus' : table === 'WorkOrder' ? 'WorkOrderStatus' : 'HseqStatus', priority: 'Priority', type: 'HseqType', norm: 'Norm' };
        const typeName = typeMap[col];
        try {
          await c.query(`ALTER TABLE "${table}" ADD COLUMN "${col}" "${typeName}"`);
          console.log(`Added "${col}" to "${table}"`);
        } catch (e) {
          console.log(`ERR "${table}"."${col}":`, e.message.split('\n')[0]);
        }
      } else {
        console.log(`OK "${table}"."${col}" already exists`);
      }
    }
  }

  // Final check
  const wo = await c.query("SELECT COUNT(*) FROM \"WorkOrder\"");
  console.log('\nWorkOrder rows:', wo.rows[0].count);

  await c.end();
  console.log('Done');
}).catch(e => console.error(e.message));
