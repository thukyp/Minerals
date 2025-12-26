import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getEmbedding, updateImageEmbedding } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { batch_id, image_path } = body;

    if (!batch_id || !image_path) {
      return new NextResponse('Missing batch_id or image_path', { status: 400 });
    }
    
    // --- BƯỚC 1: Lưu thông tin ảnh vào CSDL để lấy ID ---
    const newImageResult = await db.query(
      `INSERT INTO images (batch_id, image_path)
       VALUES ($1, $2)
       RETURNING id`, // Chỉ cần lấy lại ID
      [batch_id, image_path]
    );
      
    const imageId = newImageResult.rows[0].id;
    if (!imageId) {
        throw new Error("Không thể lấy ID của ảnh vừa tạo.");
    }
      
    // --- BƯỚE 2: Tạo embedding và cập nhật lại bản ghi (bất đồng bộ) ---
    // Chúng ta không cần đợi quá trình này hoàn tất để trả về phản hồi,
    // giúp giao diện người dùng cảm thấy nhanh hơn.
    getEmbedding(image_path)
      .then(embedding => {
        updateImageEmbedding(db, imageId, embedding);
        console.log(`Successfully created embedding for image ${imageId}`);
      })
      .catch(error => {
        console.error(`Failed to create embedding for image ${imageId}:`, error);
        // Có thể thêm logic để xử lý lỗi ở đây, ví dụ: xóa ảnh hoặc đánh dấu là lỗi.
      });

    // Trả về phản hồi ngay lập tức sau khi đã lưu thông tin ban đầu
    return NextResponse.json({ 
        id: imageId, 
        message: "Image record created. Embedding generation in progress." 
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to save image reference:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

