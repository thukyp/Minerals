import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { batch_id, ai_suggested_price, real_selling_price, selling_date } = body;

    // --- Validation cơ bản ---
    if (!batch_id || !ai_suggested_price || !real_selling_price || !selling_date) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const newSale = await db.query(
      `INSERT INTO sales_history (batch_id, ai_suggested_price, real_selling_price, selling_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [batch_id, ai_suggested_price, real_selling_price, selling_date]
    );

    return NextResponse.json(newSale.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to record sales history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

