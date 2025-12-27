import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { detectAndCropStones, getEmbedding } from '../../../../lib/ai';
import pgvector from 'pgvector/pg';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { batchId, imagePath } = await request.json();

    if (!batchId || !imagePath) {
      return NextResponse.json({ error: 'Missing batchId or imagePath' }, { status: 400 });
    }

    // 1. Detect and crop stones from the main image
    const croppedStones = await detectAndCropStones(imagePath);

    if (croppedStones.length === 0) {
      return NextResponse.json({ message: 'No stones detected in the image.' });
    }

    // 2. Get batch info (like warehouse_entry_date)
    const batchResult = await db.query('SELECT import_date FROM batches WHERE id = $1', [batchId]);
    if (batchResult.rows.length === 0) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    const warehouse_entry_date = batchResult.rows[0].import_date;


    const baseUrl = process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'
        : 'http://localhost:3000';

    let stonesCreatedCount = 0;
    // 3. Loop through cropped stones, upload them, and create stone records
    for (let i = 0; i < croppedStones.length; i++) {
      const { blob } = croppedStones[i];
      const filename = `batch_${batchId}_stone_${Date.now()}_${i}.jpg`;

      // 3a. Upload the cropped image blob
      const uploadResponse = await fetch(`${baseUrl}/api/upload?filename=${filename}`, {
        method: 'POST',
        body: blob,
        headers: {
          'Content-Type': blob.type,
        },
      });

      if (!uploadResponse.ok) {
        console.error('Failed to upload cropped image:', await uploadResponse.text());
        continue; // Skip this stone if upload fails
      }
      const uploadResult = await uploadResponse.json();
      const croppedImagePath = uploadResult.url;

      // 3b. Get embedding for the cropped image
      const embedding = await getEmbedding(croppedImagePath);

      // 3c. Create the stone record in the database
      await db.query(
        `INSERT INTO stones (batch_id, image_path, embedding, warehouse_entry_date)
         VALUES ($1, $2, $3, $4)`,
        [batchId, croppedImagePath, pgvector.toSql(embedding), warehouse_entry_date]
      );
      stonesCreatedCount++;
    }

    return NextResponse.json({
      message: 'Batch image analysis complete.',
      stonesCreated: stonesCreatedCount,
      stonesDetected: croppedStones.length,
    });

  } catch (error) {
    console.error('Error analyzing batch image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to analyze batch image', message: errorMessage }, { status: 500 });
  }
}
