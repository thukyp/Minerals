import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// --- Các hệ số điều chỉnh, có thể tinh chỉnh sau này ---
const BASE_PROFIT_MARGIN = 1.8; // Lợi nhuận cơ bản (ví dụ: 80%)
const RECENCY_WEIGHT = 0.3; // Trọng số cho các giao dịch gần đây
const TREND_INTENSITY_MAP = {
    'nhẹ': 1.1,  // Tăng/giảm 10%
    'vừa': 1.25, // Tăng/giảm 25%
    'mạnh': 1.5, // Tăng/giảm 50%
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
        return new NextResponse('Missing batchId', { status: 400 });
    }

    try {
        // --- 1. Lấy thông tin cơ bản của lô hàng ---
        const batchInfoRes = await db.query(
            `SELECT stone_type, import_price, import_date FROM batches WHERE id = $1`,
            [batchId]
        );
        if (batchInfoRes.rows.length === 0) {
            return new NextResponse('Batch not found', { status: 404 });
        }
        const { stone_type, import_price, import_date } = batchInfoRes.rows[0];
        const basePrice = parseFloat(import_price);

        // --- 2. Phân tích lịch sử bán hàng gần nhất (cùng loại đá) ---
        const historyRes = await db.query(
            `SELECT sh.real_selling_price, b.import_price
             FROM sales_history sh
             JOIN batches b ON sh.batch_id = b.id
             WHERE b.stone_type = $1
             ORDER BY sh.selling_date DESC
             LIMIT 5`,
            [stone_type]
        );

        let historicalProfitMargin = BASE_PROFIT_MARGIN;
        if (historyRes.rows.length > 0) {
            const margins = historyRes.rows.map(row => 
                parseFloat(row.real_selling_price) / parseFloat(row.import_price)
            );
            const avgMargin = margins.reduce((a, b) => a + b, 0) / margins.length;
            // Trọng số: Lấy trung bình giữa lợi nhuận cơ bản và lợi nhuận lịch sử
            historicalProfitMargin = (BASE_PROFIT_MARGIN * (1 - RECENCY_WEIGHT)) + (avgMargin * RECENCY_WEIGHT);
        }
        let suggestedPrice = basePrice * historicalProfitMargin;

        // --- 3. Kiểm tra xu hướng thị trường hiện tại ---
        const trendRes = await db.query(
            `SELECT trend, intensity FROM market_trends
             WHERE stone_type = $1 AND start_date <= CURRENT_DATE
             ORDER BY start_date DESC
             LIMIT 1`,
            [stone_type]
        );

        let reason = `Tính toán dựa trên giá nhập và lịch sử bán hàng gần đây.`;
        if (trendRes.rows.length > 0) {
            const { trend, intensity } = trendRes.rows[0];
            const multiplier = TREND_INTENSITY_MAP[intensity as keyof typeof TREND_INTENSITY_MAP] || 1.0;
            
            if (trend === 'up') {
                suggestedPrice *= multiplier;
                reason += ` Áp dụng xu hướng TĂNG ${intensity}.`;
            } else if (trend === 'down') {
                suggestedPrice /= multiplier;
                reason += ` Áp dụng xu hướng GIẢM ${intensity}.`;
            }
        }
        
        // --- 4. Tính toán khoảng giá an toàn ---
        const minPrice = suggestedPrice * 0.9; // 90% giá đề xuất
        const maxPrice = suggestedPrice * 1.2; // 120% giá đề xuất

        return NextResponse.json({
            suggestedPrice: Math.round(suggestedPrice / 1000) * 1000, // Làm tròn đến hàng nghìn
            minPrice: Math.round(minPrice / 1000) * 1000,
            maxPrice: Math.round(maxPrice / 1000) * 1000,
            reason: reason,
        });

    } catch (error) {
        console.error('Pricing calculation failed:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

