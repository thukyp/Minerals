# Trợ lý AI Định giá Khoáng vật

Ứng dụng web giúp quản lý và định giá khoáng vật thông minh sử dụng AI.

## Tính năng

- 📦 **Quản lý lô hàng**: Thêm và quản lý các lô khoáng vật với thông tin chi tiết
- 🖼️ **Tìm kiếm bằng hình ảnh**: Sử dụng AI để tìm kiếm khoáng vật từ ảnh chụp
- 💰 **Định giá thông minh**: AI đề xuất giá bán dựa trên lịch sử và xu hướng thị trường
- 📊 **Học từ dữ liệu**: Hệ thống tự động cải thiện đề xuất giá qua thời gian

## Công nghệ

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: PostgreSQL với pgvector (vector similarity search)
- **Storage**: Vercel Blob Storage
- **AI**: @xenova/transformers (CLIP model cho image embeddings)

## Cài đặt

### Yêu cầu

- Node.js 20+
- PostgreSQL 16+ với pgvector extension
- Vercel account (cho Blob Storage)

### Bước 1: Clone repository

```bash
git clone https://github.com/thukyp/Minerals.git
cd Minerals/mineral-app
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Cấu hình Database

1. Tạo database PostgreSQL:
```sql
CREATE DATABASE minerals;
```

2. Chạy schema:
```sql
\i schema.sql
```

3. Cấu hình connection string trong `.env.local`:
```env
POSTGRES_URL=postgresql://user:password@localhost:5432/minerals
```

### Bước 4: Cấu hình Vercel Blob

1. Tạo Blob Store trên [Vercel Dashboard](https://vercel.com/dashboard)
2. Lấy Read/Write Token
3. Thêm vào `.env.local`:
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

Xem chi tiết trong [SETUP_BLOB.md](./SETUP_BLOB.md)

### Bước 5: Chạy ứng dụng

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## Git Workflow

Dự án sử dụng Git Flow. Xem chi tiết trong [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)

### Các nhánh chính:
- `main` - Production
- `develop` - Development

### Tạo tính năng mới:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/ten-tinh-nang
# ... làm việc ...
git push -u origin feature/ten-tinh-nang
# Tạo Pull Request trên GitHub
```

## Cấu trúc Dự án

```
mineral-app/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── batches/      # Trang quản lý lô hàng
│   │   └── search/       # Trang tìm kiếm
│   ├── lib/              # Utilities
│   │   ├── db.ts         # Database connection
│   │   └── ai.ts         # AI embeddings
│   └── types/            # TypeScript definitions
├── public/               # Static files
├── .github/              # GitHub workflows & templates
└── schema.sql            # Database schema
```

## API Endpoints

- `POST /api/batches` - Tạo lô hàng mới
- `POST /api/images` - Lưu ảnh và tạo embedding
- `POST /api/upload` - Upload ảnh lên Vercel Blob
- `POST /api/search` - Tìm kiếm bằng hình ảnh
- `GET /api/pricing` - Lấy giá đề xuất
- `POST /api/sales-history` - Ghi nhận giao dịch

## Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## License

MIT

## Tác giả

thukyp
