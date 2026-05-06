const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:pass1234@localhost:5432/zag_offers_db?sslmode=disable"
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, phone, name, role FROM "User"');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    await client.end();
  }
}

main();
