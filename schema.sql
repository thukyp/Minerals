-- Kích hoạt extension pgvector (cần chạy lệnh này trên DB trước)
CREATE EXTENSION IF NOT EXISTS vector;

-- Bảng chứa thông tin các lô đá nhập vào
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    stone_type VARCHAR(255) NOT NULL,
    variety VARCHAR(255), -- Chủng loại chi tiết (thạch anh hồng, calcite xanh, etc.)
    import_date DATE NOT NULL,
    import_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng chứa thông tin chi tiết từng viên đá
CREATE TABLE stones (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL,
    weight DECIMAL(8, 3), -- Trọng lượng gram
    dimensions VARCHAR(100), -- Kích thước (vd: 5x3x2 cm)
    quality_score DECIMAL(3, 2), -- Điểm chất lượng từ AI (0-1)
    image_path VARCHAR(255) NOT NULL,
    embedding VECTOR(384),
    -- Pricing fields for individual stones
    individual_import_price DECIMAL(10, 2), -- Giá định mức = Giá lô / Số viên
    ai_suggested_low DECIMAL(10, 2), -- AI low price suggestion
    ai_suggested_medium DECIMAL(10, 2), -- AI medium price suggestion  
    ai_suggested_high DECIMAL(10, 2), -- AI high price suggestion
    user_selected_price DECIMAL(10, 2), -- User's final decision
    price_adjustment_percentage DECIMAL(5, 2), -- % difference from AI suggestion
    warehouse_entry_date DATE NOT NULL, -- When stone entered warehouse
    is_sold BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- Bảng lưu lịch sử bán hàng và giá đề xuất
CREATE TABLE sales_history (
    id SERIAL PRIMARY KEY,
    stone_id INTEGER, -- Liên kết với từng viên đá cụ thể
    batch_id INTEGER NOT NULL,
    stone_type VARCHAR(255) NOT NULL,
    variety VARCHAR(255),
    weight DECIMAL(8, 3),
    dimensions VARCHAR(100),
    quantity_sold INTEGER NOT NULL, -- Thường là 1 cho từng viên
    ai_suggested_price DECIMAL(10, 2) NOT NULL,
    real_selling_price DECIMAL(10, 2) NOT NULL,
    selling_date DATE NOT NULL,
    quality_score DECIMAL(3, 2), -- điểm chất lượng 0-1
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(id),
    FOREIGN KEY (stone_id) REFERENCES stones(id)
);

-- Bảng lưu các xu hướng thị trường do người dùng nhập
CREATE TABLE market_trends (
    id SERIAL PRIMARY KEY,
    stone_type VARCHAR(255) NOT NULL,
    trend VARCHAR(50) NOT NULL, -- 'increasing', 'decreasing', 'stable'
    percentage_change DECIMAL(5, 2) NOT NULL, -- e.g., +5%, -3%
    notes TEXT, -- collector trends, scarcity, hype, etc.
    start_date DATE NOT NULL,
    end_date DATE, -- Optional end date for trend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lưu lịch sử học tập của AI
CREATE TABLE ai_learning_data (
    id SERIAL PRIMARY KEY,
    stone_id INTEGER NOT NULL,
    stone_type VARCHAR(255) NOT NULL,
    image_characteristics JSONB, -- Store image analysis results
    ai_suggested_price DECIMAL(10, 2) NOT NULL,
    user_selected_price DECIMAL(10, 2) NOT NULL,
    percentage_difference DECIMAL(5, 2) NOT NULL,
    quality_score DECIMAL(3, 2),
    market_conditions JSONB, -- Market state at time of pricing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stone_id) REFERENCES stones(id) ON DELETE CASCADE
);

-- Bảng lưu lịch sử giá của từng viên đá
CREATE TABLE stone_price_history (
    id SERIAL PRIMARY KEY,
    stone_id INTEGER NOT NULL,
    price_type VARCHAR(50) NOT NULL, -- 'ai_suggestion', 'user_adjustment', 'market_update'
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2) NOT NULL,
    reason TEXT, -- Why price was changed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stone_id) REFERENCES stones(id) ON DELETE CASCADE
);

