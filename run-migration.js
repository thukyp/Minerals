const { Client } = require("./mineral-app/node_modules/pg");
const fs = require("fs");

const client = new Client({
  connectionString: "postgresql://postgres:1@localhost:5432/minerals",
});

async function runMigration() {
  try {
    await client.connect();
    const sql = fs.readFileSync("./migration-update.sql", "utf8");

    // Split SQL commands and execute them one by one
    const commands = sql.split(";").filter((cmd) => cmd.trim().length > 0);

    for (const command of commands) {
      if (command.trim()) {
        console.log("Executing:", command.trim().substring(0, 50) + "...");
        await client.query(command);
      }
    }

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Error running migration:", err);
  } finally {
    await client.end();
  }
}

runMigration();
