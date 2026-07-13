/**
 * Migrate SELECTED users (portfolios) from one Neon DB to another.
 *
 * - READ-ONLY on the source: it only runs SELECTs there, so the old DB is never modified.
 * - Copies each chosen Portfolio first, then its child rows (FK-safe order).
 * - Idempotent: uses ON CONFLICT DO NOTHING, so re-running won't duplicate or overwrite.
 *
 * Usage:
 *   OLD_DATABASE_URL="postgresql://...old..."  \
 *   NEW_DATABASE_URL="postgresql://...new..."  \
 *   USER_IDS="userId1,userId2"                 \   # host-app userId values (Portfolio.userId)
 *   node scripts/migrate-selected-users.js
 *
 * Optional: SELECT_BY="email" to match EMAILS instead of userIds (USER_IDS then holds emails).
 * Optional: DRY_RUN=1 to only report what WOULD be copied, writing nothing.
 */
const { Pool } = require('pg');

// Portfolio must come first; the rest reference it via "portfolioId".
const CHILD_TABLES = ['Photo', 'Experience', 'PricingItem', 'Project', 'GenerationJob'];

function makePool(url) {
  if (!url) throw new Error('Missing database URL');
  return new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 4 });
}

async function jsonColumns(pool, table) {
  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
       AND data_type IN ('json', 'jsonb')`,
    [table],
  );
  return new Set(rows.map((r) => r.column_name));
}

function buildInsert(table, columns, jsonCols, row) {
  const cols = columns.map((c) => `"${c}"`).join(', ');
  const params = columns.map((_, i) => `$${i + 1}`).join(', ');
  const values = columns.map((c) => {
    const v = row[c];
    // node-pg would serialise a JS array as a Postgres array literal ({a,b}),
    // which is wrong for json/jsonb columns — stringify those explicitly.
    if (v !== null && v !== undefined && jsonCols.has(c) && typeof v === 'object') {
      return JSON.stringify(v);
    }
    return v;
  });
  const sql = `INSERT INTO "${table}" (${cols}) VALUES (${params}) ON CONFLICT DO NOTHING`;
  return { sql, values };
}

async function copyTable(src, dst, table, whereSql, whereParams, dryRun) {
  const { rows } = await src.query(`SELECT * FROM "${table}" ${whereSql}`, whereParams);
  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows`);
    return 0;
  }
  const columns = Object.keys(rows[0]);
  const jsonCols = await jsonColumns(src, table);

  if (dryRun) {
    console.log(`  ${table}: would copy ${rows.length} rows (DRY_RUN)`);
    return rows.length;
  }

  let inserted = 0;
  for (const row of rows) {
    const { sql, values } = buildInsert(table, columns, jsonCols, row);
    const res = await dst.query(sql, values);
    inserted += res.rowCount;
  }
  console.log(`  ${table}: ${rows.length} matched, ${inserted} inserted (rest already existed)`);
  return inserted;
}

async function main() {
  const rawIds = (process.env.USER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const selectBy = process.env.SELECT_BY === 'email' ? 'email' : 'userId';
  const dryRun = process.env.DRY_RUN === '1';

  if (rawIds.length === 0) {
    throw new Error('Set USER_IDS="id1,id2" (comma-separated Portfolio.' + selectBy + ' values).');
  }

  const src = makePool(process.env.OLD_DATABASE_URL);
  const dst = makePool(process.env.NEW_DATABASE_URL);

  try {
    // Confirm which portfolios we matched, up front.
    const matched = await src.query(
      `SELECT id, "userId", "fullName", email FROM "Portfolio" WHERE "${selectBy}" = ANY($1::text[])`,
      [rawIds],
    );
    console.log(`\nMatched ${matched.rows.length} portfolio(s) by ${selectBy}:`);
    matched.rows.forEach((p) => console.log(`  - ${p.fullName} <${p.email}> (userId=${p.userId})`));
    if (matched.rows.length === 0) {
      console.log('\nNothing to migrate. Check your USER_IDS / SELECT_BY.');
      return;
    }

    const portfolioFilter = `WHERE "${selectBy}" = ANY($1::text[])`;
    const childFilter = `WHERE "portfolioId" IN (SELECT id FROM "Portfolio" WHERE "${selectBy}" = ANY($1::text[]))`;

    console.log(dryRun ? '\n[DRY RUN] Nothing will be written.\n' : '\nCopying...\n');
    console.log('Portfolio');
    await copyTable(src, dst, 'Portfolio', portfolioFilter, [rawIds], dryRun);
    console.log('Children');
    for (const t of CHILD_TABLES) {
      await copyTable(src, dst, t, childFilter, [rawIds], dryRun);
    }
    console.log('\nDone. Old database was only read from — untouched.');
  } finally {
    await src.end();
    await dst.end();
  }
}

main().catch((err) => {
  console.error('\nMigration failed:', err.message);
  process.exit(1);
});
