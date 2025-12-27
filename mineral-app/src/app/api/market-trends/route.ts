import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await db.query(
      `SELECT * FROM market_trends 
       ORDER BY start_date DESC, created_at DESC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching market trends:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stone_type, trend, percentage_change, notes, start_date, end_date } = body;

    if (!stone_type || !trend || typeof percentage_change !== 'number' || !start_date) {
      return new NextResponse('Missing required fields: stone_type, trend, percentage_change, start_date', { status: 400 });
    }

    // Validate trend values
    if (!['increasing', 'decreasing', 'stable'].includes(trend)) {
      return new NextResponse('Invalid trend. Must be: increasing, decreasing, or stable', { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO market_trends (stone_type, trend, percentage_change, notes, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [stone_type, trend, percentage_change, notes || null, start_date, end_date || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating market trend:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}