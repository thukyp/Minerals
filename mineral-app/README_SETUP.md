# Hướng dẫn Cấu hình Vercel Blob

## Vấn đề: Upload ảnh thất bại

Nếu bạn gặp lỗi khi upload ảnh, có thể do Vercel Blob chưa được cấu hình đúng.

## Cách khắc phục:

### 1. Tạo Vercel Blob Storage

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn hoặc tạo project mới
3. Vào tab **Storage**
4. Tạo một **Blob Store** mới
5. Copy **Read/Write Token** được cung cấp

### 2. Thêm Token vào .env.local

Tạo file `.env.local` trong thư mục `mineral-app` và thêm:

```env
BLOB_READ_WRITE_TOKEN=your_token_here
POSTGRES_URL=your_postgres_connection_string
```

### 3. Khởi động lại server

Sau khi thêm token, khởi động lại development server:

```bash
npm run dev
```

## Lưu ý:

- Token này chỉ cần thiết khi chạy local development
- Khi deploy lên Vercel, token sẽ được tự động cấu hình
- Đảm bảo file `.env.local` được thêm vào `.gitignore` để không commit token lên Git

