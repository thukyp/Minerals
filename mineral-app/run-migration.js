// Simple migration runner for the enhanced mineral system
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Running Enhanced Mineral System Migration...\n');

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.POSTGRES_URL?.includes('vercel-storage.com') ? {
      rejectUnauthorized: false,
    } : undefined,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migration-enhanced.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration...');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await client.query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('does not exist')) {
            console.log(`⚠️  Statement ${i + 1}/${statements.length} skipped (already exists)`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
          }
        }
      }
    }

    // Verify tables exist
    console.log('\n📊 Verifying tables...');
    const tables = ['batches', 'stones', 'ai_learning_data', 'market_trends', 'stone_price_history'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }

    client.release();
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📖 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to /batches/new to add your first mineral batch');
    console.log('3. Upload individual stone images and let AI suggest prices');
    console.log('4. Adjust prices with your expertise to train the AI');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };