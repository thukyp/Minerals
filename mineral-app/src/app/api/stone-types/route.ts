import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await db.query(
      `SELECT DISTINCT stone_type FROM batches ORDER BY stone_type`
    );
    const stoneTypes = result.rows.map(row => row.stone_type);
    return NextResponse.json(stoneTypes);
  } catch (error) {
    console.error('Failed to fetch stone types:', error);
    return NextResponse.json({ error: 'Failed to fetch stone types' }, { status: 500 });
  }
}