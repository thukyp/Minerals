import { db } from '@/lib/db';
import { getEmbedding } from '@/lib/ai';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import pgvector from 'pgvector/pg';

export async function POST(request: Request) {
    try {
        // --- Bước 1: Upload ảnh tra cứu lên Vercel Blob (tạm thời) ---
        // Lấy file ảnh từ request body
        if (!request.body) {
            return new NextResponse('Missing request body', { status: 400 });
        }
        
        const file = await request.blob();
        const filename = `search-temp-${Date.now()}`;
        
        const blob = await put(filename, file, {
            access: 'public',
            addRandomSuffix: false, // Không cần suffix ngẫu nhiên vì sẽ xóa ngay
        });

        // --- Bước 2: Tạo embedding cho ảnh vừa upload ---
        const embedding = await getEmbedding(blob.url);
        const embeddingSql = pgvector.toSql(embedding);
        
        // --- Bước 3: Truy vấn CSDL để tìm các vector gần nhất ---
        // Chúng ta sử dụng toán tử <=> (L2 distance) để tính khoảng cách
        // giữa vector của ảnh tra cứu và các vector đã có trong CSDL.
        // Khoảng cách càng nhỏ, ảnh càng giống nhau.
        const searchResult = await db.query(
            `SELECT 
                images.id as image_id,
                images.image_path,
                batches.id as batch_id,
                batches.stone_type,
                batches.import_date,
                batches.import_price,
                batches.quantity,
                batches.notes,
                images.embedding <=> $1 AS distance
            FROM images
            JOIN batches ON images.batch_id = batches.id
            WHERE images.embedding IS NOT NULL
            ORDER BY distance ASC
            LIMIT 5`,
            [embeddingSql]
        );

        // --- (Tùy chọn) Bước 4: Xóa ảnh tạm khỏi Vercel Blob ---
        // Vì không có SDK để xóa, bước này tạm thời bỏ qua, 
        // nhưng trong ứng dụng thực tế cần cơ chế dọn dẹp.

        return NextResponse.json(searchResult.rows);

    } catch (error) {
        console.error('Image search failed:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

