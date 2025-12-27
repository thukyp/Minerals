import { db } from '@/lib/db';
import { getEmbedding } from '@/lib/ai';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import pgvector from 'pgvector/pg';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        // --- Bước 1: Lấy ảnh tra cứu ---
        // Lấy file ảnh từ request body
        if (!request.body) {
            return new NextResponse('Missing request body', { status: 400 });
        }
        
        const file = await request.blob();
        const filename = `search-temp-${Date.now()}.jpg`;
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });
        const filePath = path.join(uploadsDir, filename);
        const arrayBuffer = await file.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(arrayBuffer));
        const imageUrl = `/uploads/${filename}`;

        // --- Bước 2: Tạo embedding cho ảnh ---
        const embedding = await getEmbedding(imageUrl);
        const embeddingSql = pgvector.toSql(embedding);
        
        // --- Bước 3: Truy vấn CSDL để tìm các vector gần nhất ---
        // Chúng ta sử dụng toán tử <=> (L2 distance) để tính khoảng cách
        // giữa vector của ảnh tra cứu và các vector đã có trong CSDL.
        // Khoảng cách càng nhỏ, ảnh càng giống nhau.
        const searchResult = await db.query(
            `SELECT 
                s.id as stone_id,
                s.image_path,
                s.quality_score,
                s.user_selected_price,
                b.id as batch_id,
                b.stone_type,
                b.import_date,
                s.embedding <=> $1 AS distance
            FROM stones s
            JOIN batches b ON s.batch_id = b.id
            WHERE s.embedding IS NOT NULL
            ORDER BY distance ASC
            LIMIT 10`,
            [embeddingSql]
        );

        // --- Bước 4: Xóa file tạm ---
        await fs.unlink(filePath).catch(() => {});

        return NextResponse.json(searchResult.rows);

    } catch (error) {
        console.error('Image search failed:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

