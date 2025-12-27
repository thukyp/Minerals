// Script to update individual import prices for existing stones
const { Pool } = require('pg');

async function updateIndividualPrices() {
  console.log('🔄 Updating individual import prices for existing stones...\n');

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.POSTGRES_URL?.includes('vercel-storage.com') ? {
      rejectUnauthorized: false,
    } : undefined,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Add individual_import_price column if it doesn't exist
    console.log('📊 Adding individual_import_price column...');
    await client.query(`
      ALTER TABLE stones 
      ADD COLUMN IF NOT EXISTS individual_import_price DECIMAL(10, 2)
    `);

    // Update individual import prices for existing stones
    console.log('💰 Calculating individual import prices...');
    const result = await client.query(`
      UPDATE stones 
      SET individual_import_price = b.import_price / b.quantity 
      FROM batches b 
      WHERE stones.batch_id = b.id 
      AND stones.individual_import_price IS NULL
      RETURNING stones.id, stones.individual_import_price
    `);

    console.log(`✅ Updated ${result.rowCount} stones with individual import prices`);

    // Show some examples
    if (result.rows.length > 0) {
      console.log('\n📋 Examples of updated prices:');
      result.rows.slice(0, 5).forEach(row => {
        console.log(`   Stone ID ${row.id}: ${new Intl.NumberFormat('vi-VN').format(row.individual_import_price)} VNĐ/viên`);
      });
    }

    // Verify the update
    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as total_stones,
        COUNT(individual_import_price) as stones_with_price,
        AVG(individual_import_price) as avg_price
      FROM stones
    `);

    const stats = verifyResult.rows[0];
    console.log('\n📊 Summary:');
    console.log(`   Total stones: ${stats.total_stones}`);
    console.log(`   Stones with individual price: ${stats.stones_with_price}`);
    if (stats.avg_price) {
      console.log(`   Average individual price: ${new Intl.NumberFormat('vi-VN').format(stats.avg_price)} VNĐ/viên`);
    }

    client.release();
    console.log('\n🎉 Individual price update completed successfully!');
    console.log('\n📖 What this means:');
    console.log('✅ Số viên = Tổng số lượng của lô');
    console.log('✅ Giá lô = Tổng giá của toàn bộ viên');
    console.log('✅ Giá định mức = Giá lô chia cho số viên');
    console.log('\n💡 AI will now use individual stone prices for pricing suggestions!');

  } catch (error) {
    console.error('❌ Update failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run update if called directly
if (require.main === module) {
  updateIndividualPrices().catch(console.error);
}

module.exports = { updateIndividualPrices };