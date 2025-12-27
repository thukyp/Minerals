import { db } from '@/lib/db';
import { recordUserPriceAdjustment } from '@/lib/pricing-engine';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const stoneId = parseInt(id);

        if (isNaN(stoneId)) {
            return new NextResponse('Invalid stone ID', { status: 400 });
        }

        const body = await request.json();
        const { ai_suggestion, user_selected_price } = body;

        if (!ai_suggestion || typeof user_selected_price !== 'number') {
            return new NextResponse('Missing required fields: ai_suggestion, user_selected_price', { status: 400 });
        }

        // Record the user's price adjustment and train the AI
        await recordUserPriceAdjustment(
            stoneId,
            ai_suggestion,
            user_selected_price
        );

        return NextResponse.json({
            success: true,
            message: 'Price adjustment recorded and AI learning data updated'
        });

    } catch (error) {
        console.error('Error recording price adjustment:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}