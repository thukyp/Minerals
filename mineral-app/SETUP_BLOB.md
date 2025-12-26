# Hướng dẫn Cấu hình Vercel Blob Storage

## Bước 1: Tạo Vercel Account (nếu chưa có)

1. Truy cập: https://vercel.com/signup
2. Đăng ký bằng GitHub, GitLab, hoặc email

## Bước 2: Tạo Blob Store

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Click vào **Storage** ở thanh menu bên trái
3. Click **Create Database** hoặc **Add Storage**
4. Chọn **Blob**
5. Đặt tên cho Blob Store (ví dụ: `mineral-images`)
6. Chọn region gần bạn nhất
7. Click **Create**

## Bước 3: Lấy Read/Write Token

1. Sau khi tạo Blob Store, click vào tên store vừa tạo
2. Vào tab **Settings**
3. Tìm mục **Tokens** hoặc **Access Tokens**
4. Click **Create Token** hoặc **Generate Token**
5. Chọn quyền **Read/Write**
6. Copy token được tạo (có dạng: `vercel_blob_rw_xxxxxxxxxxxxx`)

⚠️ **Lưu ý**: Token chỉ hiển thị một lần, hãy copy ngay!

## Bước 4: Tạo file .env.local

1. Trong thư mục `mineral-app`, tạo file mới tên `.env.local`
2. Copy nội dung từ file `.env.example`
3. Thay thế `vercel_blob_rw_xxxxxxxxxxxxx` bằng token bạn vừa copy
4. Điền thông tin PostgreSQL của bạn

Ví dụ:
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_abc123xyz789
POSTGRES_URL=postgresql://postgres:mypassword@localhost:5432/minerals
```

## Bước 5: Khởi động lại Server

```bash
npm run dev
```

## Kiểm tra

Sau khi cấu hình xong, thử upload ảnh lại. Nếu vẫn lỗi, kiểm tra:
- Token đã được copy đúng chưa (không có khoảng trắng thừa)
- File `.env.local` nằm đúng trong thư mục `mineral-app`
- Đã khởi động lại server sau khi thêm token

## Lưu ý quan trọng

- File `.env.local` đã được thêm vào `.gitignore`, sẽ không bị commit lên Git
- Token này chỉ dùng cho development local
- Khi deploy lên Vercel, token sẽ được tự động cấu hình

