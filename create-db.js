const { Client } = require("./mineral-app/node_modules/pg");

const client = new Client({
  connectionString: "postgresql://postgres:1@localhost:5432/postgres",
});

async function setupDB() {
  try {
    await client.connect();
    await client.query("CREATE DATABASE minerals;");
    console.log("Database created");
  } catch (err) {
    console.error("Error creating database:", err);
  } finally {
    await client.end();
  }
}

setupDB();
