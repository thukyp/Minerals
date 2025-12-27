import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const imageData = await db.query(`
      SELECT
        i.id,
        i.image_path,
        i.created_at,
        b.stone_type,
        b.id as batch_id
      FROM images i
      JOIN batches b ON i.batch_id = b.id
      ORDER BY i.created_at DESC
    `);

    return NextResponse.json({ images: imageData.rows });

  } catch (error) {
    console.error('Failed to fetch gallery images:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
