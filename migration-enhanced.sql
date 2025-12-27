-- Migration script to enhance the mineral app database schema
-- Run this after the initial schema.sql

-- Add new columns to stones table for individual stone management
ALTER TABLE stones ADD COLUMN IF NOT EXISTS individual_import_price DECIMAL(10, 2);
ALTER TABLE stones ADD COLUMN IF NOT EXISTS ai_suggested_low DECIMAL(10, 2);
ALTER TABLE stones ADD COLUMN IF NOT EXISTS ai_suggested_medium DECIMAL(10, 2);
ALTER TABLE stones ADD COLUMN IF NOT EXISTS ai_suggested_high DECIMAL(10, 2);
ALTER TABLE stones ADD COLUMN IF NOT EXISTS user_selected_price DECIMAL(10, 2);
ALTER TABLE stones ADD COLUMN IF NOT EXISTS price_adjustment_percentage DECIMAL(5, 2);
ALTER TABLE stones ADD COLUMN IF NOT EXISTS warehouse_entry_date DATE;
ALTER TABLE stones ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE;

-- Calculate individual import price for existing stones
UPDATE stones 
SET individual_import_price = b.import_price / b.quantity 
FROM batches b 
WHERE stones.batch_id = b.id 
AND stones.individual_import_price IS NULL;

-- Update existing stones to have warehouse_entry_date from batch import_date
UPDATE stones 
SET warehouse_entry_date = b.import_date 
FROM batches b 
WHERE stones.batch_id = b.id 
AND stones.warehouse_entry_date IS NULL;

-- Make warehouse_entry_date NOT NULL after updating existing records
ALTER TABLE stones ALTER COLUMN warehouse_entry_date SET NOT NULL;

-- Update market_trends table structure
ALTER TABLE market_trends DROP COLUMN IF EXISTS intensity;
ALTER TABLE market_trends ADD COLUMN IF NOT EXISTS percentage_change DECIMAL(5, 2) NOT NULL DEFAULT 0;
ALTER TABLE market_trends ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE market_trends ADD COLUMN IF NOT EXISTS end_date DATE;

-- Update trend values from old format to new format
UPDATE market_trends SET trend = 'increasing' WHERE trend = 'up';
UPDATE market_trends SET trend = 'decreasing' WHERE trend = 'down';

-- Create AI learning data table
CREATE TABLE IF NOT EXISTS ai_learning_data (
    id SERIAL PRIMARY KEY,
    stone_id INTEGER NOT NULL,
    stone_type VARCHAR(255) NOT NULL,
    image_characteristics JSONB,
    ai_suggested_price DECIMAL(10, 2) NOT NULL,
    user_selected_price DECIMAL(10, 2) NOT NULL,
    percentage_difference DECIMAL(5, 2) NOT NULL,
    quality_score DECIMAL(3, 2),
    market_conditions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stone_id) REFERENCES stones(id) ON DELETE CASCADE
);

-- Create stone price history table
CREATE TABLE IF NOT EXISTS stone_price_history (
    id SERIAL PRIMARY KEY,
    stone_id INTEGER NOT NULL,
    price_type VARCHAR(50) NOT NULL, -- 'ai_suggestion', 'user_adjustment', 'market_update'
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stone_id) REFERENCES stones(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stones_batch_id ON stones(batch_id);
CREATE INDEX IF NOT EXISTS idx_stones_warehouse_entry_date ON stones(warehouse_entry_date);
CREATE INDEX IF NOT EXISTS idx_stones_is_sold ON stones(is_sold);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_stone_type ON ai_learning_data(stone_type);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_created_at ON ai_learning_data(created_at);
CREATE INDEX IF NOT EXISTS idx_market_trends_stone_type ON market_trends(stone_type);
CREATE INDEX IF NOT EXISTS idx_market_trends_start_date ON market_trends(start_date);
CREATE INDEX IF NOT EXISTS idx_stone_price_history_stone_id ON stone_price_history(stone_id);

-- Update sales_history to reference stones instead of batches where possible
ALTER TABLE sales_history ADD COLUMN IF NOT EXISTS stone_id INTEGER;
ALTER TABLE sales_history ADD CONSTRAINT fk_sales_history_stone_id 
    FOREIGN KEY (stone_id) REFERENCES stones(id) ON DELETE SET NULL;