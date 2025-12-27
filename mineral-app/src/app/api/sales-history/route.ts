import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get sales statistics for the last 90 days
    const salesStats = await db.query(`
      SELECT 
        b.stone_type,
        COUNT(sh.id) as total_sales,
        AVG(CASE WHEN sh.ai_suggested_price > 0 THEN 
          ABS(sh.real_selling_price - sh.ai_suggested_price) / sh.ai_suggested_price 
          ELSE NULL END) as avg_accuracy,
        AVG(sh.real_selling_price) as avg_selling_price,
        MIN(sh.real_selling_price) as min_price,
        MAX(sh.real_selling_price) as max_price,
        AVG(sh.quality_score) as avg_quality,
        MAX(sh.selling_date) as last_sale_date
      FROM sales_history sh
      JOIN batches b ON sh.batch_id = b.id
      WHERE sh.selling_date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY b.stone_type
      ORDER BY total_sales DESC
    `);

    return NextResponse.json({
      sales_stats: salesStats.rows
    });
  } catch (error) {
    console.error('Failed to fetch sales statistics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { batch_id, stone_type, quantity_sold, ai_suggested_price, real_selling_price, quality_score, notes } = body;

    // --- Validation cơ bản ---
    if (!batch_id || !real_selling_price) {
      return new NextResponse('Missing required fields: batch_id, real_selling_price', { status: 400 });
    }

    // Insert sales record
    const newSale = await db.query(
      `INSERT INTO sales_history (batch_id, stone_type, quantity_sold, ai_suggested_price, real_selling_price, selling_date, quality_score, notes)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7)
       RETURNING *`,
      [batch_id, stone_type, quantity_sold || 1, ai_suggested_price || 0, real_selling_price, quality_score, notes]
    );

    // Update batch quantity (reduce by quantity sold)
    if (quantity_sold) {
      await db.query(
        `UPDATE batches 
         SET quantity = quantity - $1 
         WHERE id = $2 AND quantity >= $1`,
        [quantity_sold, batch_id]
      );
    }

    return NextResponse.json(newSale.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to record sales history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

