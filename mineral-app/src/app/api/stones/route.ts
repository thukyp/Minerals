import { db } from '@/lib/db';
import { getEmbedding, updateImageEmbedding } from '@/lib/ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { batch_id, image_path, warehouse_entry_date, weight, dimensions } = body;

        if (!batch_id || !image_path || !warehouse_entry_date) {
            return new NextResponse('Missing required fields: batch_id, image_path, warehouse_entry_date', { status: 400 });
        }

        // Create stone record
        const result = await db.query(
            `INSERT INTO stones (batch_id, image_path, warehouse_entry_date, weight, dimensions, quality_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [batch_id, image_path, warehouse_entry_date, weight || null, dimensions || null, 0.5] // Default quality score
        );

        const stone = result.rows[0];

        // Calculate individual stone price from batch
        // Get batch info to calculate per-stone price
        const batchInfo = await db.query(
            `SELECT import_price, quantity FROM batches WHERE id = $1`,
            [batch_id]
        );

        if (batchInfo.rows.length > 0) {
            const { import_price, quantity } = batchInfo.rows[0];
            const perStonePrice = parseFloat(import_price) / parseInt(quantity); // Giá định mức = Giá lô / Số viên

            // Update stone with calculated individual price
            await db.query(
                `UPDATE stones SET individual_import_price = $1 WHERE id = $2`,
                [perStonePrice, stone.id]
            );
        }

        // Generate embedding asynchronously (don't block the response)
        setImmediate(async () => {
            try {
                const embedding = await getEmbedding(image_path);
                await updateImageEmbedding(db, stone.id, embedding);

                // TODO: Add quality assessment here
                // const qualityScore = await assessImageQuality(image_path);
                // await db.query('UPDATE stones SET quality_score = $1 WHERE id = $2', [qualityScore, stone.id]);

            } catch (error) {
                console.error('Failed to generate embedding for stone:', stone.id, error);
            }
        });

        return NextResponse.json(stone, { status: 201 });
    } catch (error) {
        console.error('Error creating stone:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const batchId = searchParams.get('batch_id');

        let query = `
      SELECT s.*, b.stone_type, b.import_price, b.import_date, b.quantity
      FROM stones s
      JOIN batches b ON s.batch_id = b.id
    `;
        const params: (string | number)[] = [];

        if (batchId) {
            query += ' WHERE s.batch_id = $1';
            params.push(parseInt(batchId));
        }

        query += ' ORDER BY s.created_at DESC';

        const result = await db.query(query, params);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching stones:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, user_selected_price, is_sold } = body;

        if (!id) {
            return new NextResponse('Missing stone id', { status: 400 });
        }

        const updates: string[] = [];
        const params: unknown[] = [];
        let paramIndex = 1;

        if (user_selected_price !== undefined) {
            updates.push(`user_selected_price = $${paramIndex++}`);
            params.push(user_selected_price);
        }

        if (is_sold !== undefined) {
            updates.push(`is_sold = $${paramIndex++}`);
            params.push(is_sold);
        }

        if (updates.length === 0) {
            return new NextResponse('No fields to update', { status: 400 });
        }

        params.push(id);

        const result = await db.query(
            `UPDATE stones SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return new NextResponse('Stone not found', { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating stone:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}