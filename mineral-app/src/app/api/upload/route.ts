import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    let filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Missing filename parameter' },
        { status: 400 }
      );
    }

    // Làm sạch filename để tránh ký tự đặc biệt gây lỗi
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Đọc body dưới dạng Blob
    const blob = await request.blob();
    
    if (blob.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      // Trong development, lưu file vào thư mục local
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, filename);
      const arrayBuffer = await blob.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));
      
      return NextResponse.json({
        url: `/uploads/${filename}`,
        pathname: `/uploads/${filename}`,
        contentType: blob.type,
        size: blob.size,
      });
    } else {
      // Trong production, upload lên Vercel Blob
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      
      const uploadOptions: {
        access: 'public';
        token?: string;
      } = {
        access: 'public',
      };

      if (token) {
        uploadOptions.token = token;
      }
      
      // Upload lên Vercel Blob
      const result = await put(filename, blob, uploadOptions);

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    // Trả về thông báo lỗi chi tiết hơn
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error('Error details:', errorDetails);
    
    // Kiểm tra nếu là lỗi authentication
    if (errorMessage.includes('token') || errorMessage.includes('unauthorized')) {
      return NextResponse.json(
        { 
          error: 'Vercel Blob authentication failed',
          message: 'Vui lòng cấu hình BLOB_READ_WRITE_TOKEN trong file .env.local',
          hint: 'Xem file README_SETUP.md để biết cách cấu hình'
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        message: errorMessage,
        // Chỉ trả về details trong development
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
      },
      { status: 500 }
    );
  }
}

