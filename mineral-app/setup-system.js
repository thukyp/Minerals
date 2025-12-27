// Setup script to verify the mineral pricing system is ready
const { Pool } = require('pg');

async function setupSystem() {
  console.log('🚀 Setting up Mineral AI Pricing System...\n');

  // Check environment variables
  console.log('📋 Checking environment variables...');
  const requiredEnvVars = ['POSTGRES_URL', 'BLOB_READ_WRITE_TOKEN'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars.join(', '));
    console.log('Please add them to your .env.local file\n');
    return;
  }
  console.log('✅ Environment variables configured\n');

  // Test database connection
  console.log('🗄️  Testing database connection...');
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.POSTGRES_URL?.includes('vercel-storage.com') ? {
      rejectUnauthorized: false,
    } : undefined,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');

    // Check if tables exist
    console.log('📊 Checking database schema...');
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
        console.log(`❌ Table '${table}' missing - run migration-enhanced.sql`);
      }
    }

    // Check pgvector extension
    const vectorCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_extension 
        WHERE extname = 'vector'
      );
    `);
    
    if (vectorCheck.rows[0].exists) {
      console.log('✅ pgvector extension enabled');
    } else {
      console.log('❌ pgvector extension missing - enable it in your database');
    }

    client.release();
    console.log('\n🎉 System setup verification complete!');
    console.log('\n📖 Next steps:');
    console.log('1. If any tables are missing, run: migration-enhanced.sql');
    console.log('2. Start the development server: npm run dev');
    console.log('3. Navigate to /batches/new to add your first mineral batch');
    console.log('4. Upload individual stone images and let AI suggest prices');
    console.log('5. Adjust prices with your expertise to train the AI');
    console.log('6. Add market conditions at /market-trends');
    console.log('\n💡 The AI will learn from your pricing decisions and improve over time!');

  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('Please check your POSTGRES_URL environment variable');
  } finally {
    await pool.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupSystem().catch(console.error);
}

module.exports = { setupSystem };