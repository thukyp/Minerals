import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await db.query(
      `SELECT b.*, COUNT(s.id) as stone_count
       FROM batches b
       LEFT JOIN stones s ON b.id = s.batch_id
       GROUP BY b.id
       ORDER BY b.created_at DESC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch batches:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stone_type, import_date, import_price, quantity, notes } = body;

    // --- Validation cơ bản ---
    if (!stone_type || !import_date || !import_price || !quantity) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const newBatch = await db.query(
      `INSERT INTO batches (stone_type, import_date, import_price, quantity, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [stone_type, import_date, import_price, quantity, notes]
    );

    return NextResponse.json(newBatch.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create batch:', error);
    // Kiểm tra nếu lỗi là từ Postgres (ví dụ: lỗi cú pháp,...)
    if (error instanceof Error && 'code' in error) {
      // Đây là một cách chung để bắt lỗi từ pg, bạn có thể thêm các mã lỗi cụ thể
      return new NextResponse('Database error', { status: 500 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

