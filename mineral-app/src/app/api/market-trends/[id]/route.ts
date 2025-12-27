import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const trendId = parseInt(id);

        if (isNaN(trendId)) {
            return new NextResponse('Invalid trend ID', { status: 400 });
        }

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
            `UPDATE market_trends 
       SET stone_type = $1, trend = $2, percentage_change = $3, notes = $4, 
           start_date = $5, end_date = $6
       WHERE id = $7
       RETURNING *`,
            [stone_type, trend, percentage_change, notes || null, start_date, end_date || null, trendId]
        );

        if (result.rows.length === 0) {
            return new NextResponse('Market trend not found', { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating market trend:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const trendId = parseInt(id);

        if (isNaN(trendId)) {
            return new NextResponse('Invalid trend ID', { status: 400 });
        }

        const result = await db.query(
            'DELETE FROM market_trends WHERE id = $1 RETURNING *',
            [trendId]
        );

        if (result.rows.length === 0) {
            return new NextResponse('Market trend not found', { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Market trend deleted successfully' });
    } catch (error) {
        console.error('Error deleting market trend:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}