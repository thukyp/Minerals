import { db } from '@/lib/db';
import { getUpdatedPricing } from '@/lib/pricing-engine';
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

        const updatedPricing = await getUpdatedPricing(stoneId);

        return NextResponse.json(updatedPricing);

    } catch (error) {
        console.error('Error fetching stone details:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}