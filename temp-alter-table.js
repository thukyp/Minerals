const { Client } = require("./mineral-app/node_modules/pg");

const client = new Client({
  connectionString: "postgresql://postgres:1@localhost:5432/minerals",
});

async function runMigration() {
  try {
    await client.connect();
    // This is a more robust way to handle schema changes.
    // We alter the existing table instead of dropping and recreating it.
    const alterTableQuery = 'ALTER TABLE stones ALTER COLUMN embedding TYPE VECTOR(512);';
    await client.query(alterTableQuery);
    console.log("Successfully altered the 'stones' table. Column 'embedding' is now VECTOR(512).");
  } catch (err) {
    console.error("Error running migration:", err);
  } finally {
    await client.end();
  }
}

runMigration();
