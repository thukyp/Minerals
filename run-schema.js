const { Client } = require("./mineral-app/node_modules/pg");
const fs = require("fs");

const client = new Client({
  connectionString: "postgresql://postgres:1@localhost:5432/minerals",
});

async function runSQL() {
  try {
    await client.connect();
    const sql = fs.readFileSync("./schema.sql", "utf8");
    await client.query(sql);
    console.log("Schema created");
  } catch (err) {
    console.error("Error running schema:", err);
  } finally {
    await client.end();
  }
}

runSQL();
