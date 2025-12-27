import { db } from '@/lib/db';
import { generateAIPriceSuggestion } from '@/lib/pricing-engine';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const stoneId = parseInt(params.id);

        if (isNaN(stoneId)) {
            return new NextResponse('Invalid stone ID', { status: 400 });
        }

        // Get stone and batch information
        const stoneResult = await db.query(
            `SELECT s.*, b.import_price, b.import_date, b.quantity
       FROM stones s
       JOIN batches b ON s.batch_id = b.id
       WHERE s.id = $1`,
            [stoneId]
        );

        if (stoneResult.rows.length === 0) {
            return new NextResponse('Stone not found', { status: 404 });
        }

        const stone = stoneResult.rows[0];

        // Calculate individual import price if not already set
        let individualImportPrice = stone.individual_import_price;
        if (!individualImportPrice) {
            individualImportPrice = parseFloat(stone.import_price) / parseInt(stone.quantity);
            // Update the stone record with calculated price
            await db.query(
                `UPDATE stones SET individual_import_price = $1 WHERE id = $2`,
                [individualImportPrice, stoneId]
            );
        }

        // Generate AI pricing suggestion using individual stone price
        const pricingSuggestion = await generateAIPriceSuggestion(
            stoneId,
            parseFloat(individualImportPrice),
            new Date(stone.warehouse_entry_date || stone.import_date),
            parseFloat(stone.quality_score) || 0.5
        );

        return NextResponse.json(pricingSuggestion);

    } catch (error) {
        console.error('Error generating pricing suggestion:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}