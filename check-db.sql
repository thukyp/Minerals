-- Script kiểm tra và cập nhật database
-- Chạy script này trong PostgreSQL

-- Kiểm tra các bảng tồn tại
SELECT 'Checking tables...' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('batches', 'sales_history', 'market_trends');

-- Kiểm tra cấu trúc bảng sales_history
SELECT 'Checking sales_history columns...' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_history'
ORDER BY ordinal_position;

-- Thêm các cột nếu thiếu
DO $$
BEGIN
    -- Thêm stone_type nếu chưa có
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'sales_history' AND column_name = 'stone_type') THEN
        ALTER TABLE sales_history ADD COLUMN stone_type VARCHAR(255);
        RAISE NOTICE 'Added stone_type column';
    END IF;

    -- Thêm quantity_sold nếu chưa có
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'sales_history' AND column_name = 'quantity_sold') THEN
        ALTER TABLE sales_history ADD COLUMN quantity_sold INTEGER;
        RAISE NOTICE 'Added quantity_sold column';
    END IF;

    -- Thêm quality_score nếu chưa có
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'sales_history' AND column_name = 'quality_score') THEN
        ALTER TABLE sales_history ADD COLUMN quality_score DECIMAL(3, 2);
        RAISE NOTICE 'Added quality_score column';
    END IF;

    -- Thêm notes nếu chưa có
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'sales_history' AND column_name = 'notes') THEN
        ALTER TABLE sales_history ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;
END $$;

-- Tạo bảng market_trends nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS market_trends (
    id SERIAL PRIMARY KEY,
    stone_type VARCHAR(255) NOT NULL,
    trend VARCHAR(50) NOT NULL,
    intensity VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cập nhật stone_type từ batches nếu chưa có
UPDATE sales_history
SET stone_type = b.stone_type
FROM batches b
WHERE sales_history.batch_id = b.id
AND (sales_history.stone_type IS NULL OR sales_history.stone_type = '');

-- Kiểm tra dữ liệu
SELECT 'Final check - sales_history:' as info, COUNT(*) as count FROM sales_history;
SELECT 'Final check - market_trends:' as info, COUNT(*) as count FROM market_trends;
SELECT 'Final check - batches:' as info, COUNT(*) as count FROM batches;