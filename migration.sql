-- Migration script để cập nhật database với các trường mới
-- Chạy script này trong PostgreSQL để thêm các trường mới mà không mất dữ liệu

-- Thêm các trường mới vào bảng sales_history
ALTER TABLE sales_history
ADD COLUMN IF NOT EXISTS stone_type VARCHAR(255),
ADD COLUMN IF NOT EXISTS quantity_sold INTEGER,
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Cập nhật dữ liệu stone_type từ bảng batches (nếu chưa có)
UPDATE sales_history
SET stone_type = b.stone_type
FROM batches b
WHERE sales_history.batch_id = b.id
AND sales_history.stone_type IS NULL;

-- Tạo bảng market_trends nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS market_trends (
    id SERIAL PRIMARY KEY,
    stone_type VARCHAR(255) NOT NULL,
    trend VARCHAR(50) NOT NULL, -- 'up' or 'down' or 'stable'
    intensity VARCHAR(50) NOT NULL, -- 'nhẹ', 'vừa', 'mạnh'
    start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo index để tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_sales_history_stone_type ON sales_history(stone_type);
CREATE INDEX IF NOT EXISTS idx_sales_history_selling_date ON sales_history(selling_date);
CREATE INDEX IF NOT EXISTS idx_market_trends_stone_type ON market_trends(stone_type);

-- Kiểm tra dữ liệu
SELECT 'sales_history count:' as info, COUNT(*) as count FROM sales_history
UNION ALL
SELECT 'market_trends count:', COUNT(*) FROM market_trends;