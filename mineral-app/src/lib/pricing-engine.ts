import { db } from './db';
import { evaluateStoneQuality } from './ai';
import pgvector from 'pgvector/pg';
import type { DatabaseConnection } from '../types/database';

// Core pricing constants as per specification
const ANNUAL_INFLATION_RATE = 0.06; // 6% per year
const DEFAULT_PROFIT_MARGIN = 1.8; // 80% profit

interface StoneCharacteristics {
    clarity: number; // 0-1
    color: number; // 0-1  
    inclusions: number; // 0-1 (lower = better)
    rarity: number; // 0-1
}

interface MarketCondition {
    stone_type: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    percentage_change: number;
    notes?: string;
}

interface PricingSuggestion {
    low: number;
    medium: number;
    high: number;
    reason: string;
    characteristics: any; // Allow flexible characteristics from AI
}

/**
 * VI. TIME-BASED & INFLATION PRICING (MANDATORY)
 * Standard formula: Current price = Base price × (1 + 0.06)^years
 */
export function calculateInflationAdjustment(
    basePrice: number,
    warehouseEntryDate: Date
): number {
    const currentDate = new Date();
    const yearsStored = (currentDate.getTime() - warehouseEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return basePrice * Math.pow(1 + ANNUAL_INFLATION_RATE, yearsStored);
}

/**
 * II. AI INITIAL PRICE SUGGESTION - Refactored with Vector Search and Real Quality Score
 */
export async function generateAIPriceSuggestion(
    stoneId: number
): Promise<PricingSuggestion> {

    // 1. Fetch all necessary stone data in one go
    const stoneInfoRes = await db.query(
        `SELECT s.id, s.image_path, s.individual_import_price, s.warehouse_entry_date, s.embedding, b.stone_type
         FROM stones s 
         JOIN batches b ON s.batch_id = b.id 
         WHERE s.id = `,
        [stoneId]
    );

    if (stoneInfoRes.rows.length === 0) throw new Error('Stone not found');
    const { image_path, individual_import_price, warehouse_entry_date, stone_type, embedding } = stoneInfoRes.rows[0];

    // 2. Get real quality score from AI
    const { quality, features } = await evaluateStoneQuality(image_path);
    // Update the stone's quality score in the DB for future use
    await db.query('UPDATE stones SET quality_score =  WHERE id = $2', [quality, stoneId]);

    let reason = `Phân tích dựa trên giá nhập ${new Intl.NumberFormat('vi-VN').format(individual_import_price)} VNĐ/viên, chất lượng AI đánh giá: ${(quality * 100).toFixed(0)}%.`;

    // 3. Learn from visually similar stones (Vector Search)
    let visualMargin = null;
    const similarStonesRes = await db.query(
        `SELECT s.id, sh.real_selling_price / s.individual_import_price AS margin
         FROM stones s
         JOIN sales_history sh ON s.id = sh.stone_id
         WHERE s.is_sold = TRUE AND s.id !=  AND s.individual_import_price > 0 AND s.embedding IS NOT NULL
         ORDER BY s.embedding <=> $2
         LIMIT 5`,
        [stoneId, pgvector.toSql(embedding)]
    );
    
    if (similarStonesRes.rows.length > 0) {
        const totalMargin = similarStonesRes.rows.reduce((sum, row) => sum + parseFloat(row.margin), 0);
        visualMargin = totalMargin / similarStonesRes.rows.length;
        reason += ` | Học từ ${similarStonesRes.rows.length} viên đá tương tự.`;
    }

    // 4. Learn from user's pricing habits for this stone TYPE
    let learnedMargin = null;
    const learningDataRes = await db.query(
        `SELECT AVG(user_selected_price / ai_suggested_medium) as avg_margin
         FROM ai_learning_data ald
         WHERE ald.stone_type =  AND ald.ai_suggested_medium > 0
         GROUP BY ald.stone_type`,
        [stone_type]
    );

    if (learningDataRes.rows.length > 0) {
        learnedMargin = parseFloat(learningDataRes.rows[0].avg_margin);
        reason += ` | Thói quen của bạn với loại đá này được áp dụng.`;
    }
    
    // 5. Blend margins for a smarter final margin
    let blendedMargin = DEFAULT_PROFIT_MARGIN;
    if (visualMargin && learnedMargin) {
        blendedMargin = (DEFAULT_PROFIT_MARGIN * 0.2) + (visualMargin * 0.5) + (learnedMargin * 0.3); // Give visual similarity the most weight
    } else if (visualMargin) {
        blendedMargin = (DEFAULT_PROFIT_MARGIN * 0.4) + (visualMargin * 0.6);
    } else if (learnedMargin) {
        blendedMargin = (DEFAULT_PROFIT_MARGIN * 0.4) + (learnedMargin * 0.6);
    }

    // 6. Calculate final price based on all factors
    const inflationAdjustedPrice = calculateInflationAdjustment(individual_import_price, warehouse_entry_date);
    const basePrice = inflationAdjustedPrice * blendedMargin;
    const qualityMultiplier = 0.5 + (quality * 1.0); // 0.5x to 1.5x
    const qualityAdjustedPrice = basePrice * qualityMultiplier;

    const marketTrend = await getCurrentMarketTrend(stone_type);
    let marketAdjustedPrice = qualityAdjustedPrice;
    if (marketTrend) {
        const trendMultiplier = 1 + (marketTrend.percentage_change / 100);
        marketAdjustedPrice = qualityAdjustedPrice * trendMultiplier;
        reason += ` | Xu hướng thị trường: ${marketTrend.trend} ${marketTrend.percentage_change > 0 ? '+' : ''}${marketTrend.percentage_change}%`;
    }

    // Generate price range
    const mediumPrice = Math.round(marketAdjustedPrice / 1000) * 1000;
    
    return {
        low: Math.round(mediumPrice * 0.85 / 1000) * 1000,
        medium: mediumPrice,
        high: Math.round(mediumPrice * 1.25 / 1000) * 1000,
        reason,
        characteristics: { quality, features }
    };
}


/**
 * V. MANUAL MARKET CONDITION INPUT (VERY REALISTIC)
 */
export async function getCurrentMarketTrend(stoneType: string): Promise<MarketCondition | null> {
    const result = await db.query(
        `SELECT stone_type, trend, percentage_change, notes
         FROM market_trends 
         WHERE stone_type ILIKE  
           AND (end_date IS NULL OR end_date >= CURRENT_DATE)
           AND start_date <= CURRENT_DATE
         ORDER BY start_date DESC 
         LIMIT 1`,
        [stoneType]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * III. USER PRICE ADJUSTMENT (EXTREMELY IMPORTANT)
 * IV. AI MEMORY & CONTINUOUS LEARNING (LEARNING LOOP)
 */
export async function recordUserPriceAdjustment(
    stoneId: number,
    aiSuggestion: PricingSuggestion,
    userSelectedPrice: number
): Promise<void> {

    const percentageDifference = ((userSelectedPrice - aiSuggestion.medium) / aiSuggestion.medium) * 100;

    const { quality, features } = aiSuggestion.characteristics;

    // Update stone with user's decision and latest AI data
    const stoneUpdateRes = await db.query(
        `UPDATE stones 
         SET ai_suggested_low = , ai_suggested_medium = $2, ai_suggested_high = $3,
             user_selected_price = $4, price_adjustment_percentage = $5, quality_score = $6
         WHERE id = $7 RETURNING batch_id`,
        [aiSuggestion.low, aiSuggestion.medium, aiSuggestion.high, userSelectedPrice, percentageDifference, quality, stoneId]
    );

    const batchId = stoneUpdateRes.rows[0]?.batch_id;
    if (!batchId) throw new Error('Could not find batch for stone.');
    
    const batchRes = await db.query('SELECT stone_type FROM batches WHERE id = ', [batchId]);
    const stoneType = batchRes.rows[0]?.stone_type;
    if (!stoneType) throw new Error('Could not find stone type for batch.');

    // Store learning data for AI improvement
    await db.query(
        `INSERT INTO ai_learning_data 
         (stone_id, stone_type, image_characteristics, ai_suggested_price, 
          user_selected_price, percentage_difference, quality_score, market_conditions)
         VALUES (, $2, $3, $4, $5, $6, $7, $8)`,
        [
            stoneId,
            stoneType,
            JSON.stringify(features),
            aiSuggestion.medium,
            userSelectedPrice,
            percentageDifference,
            quality,
            JSON.stringify(await getCurrentMarketTrend(stoneType))
        ]
    );

    // Record price history
    await db.query(
        `INSERT INTO stone_price_history (stone_id, price_type, new_price, reason)
         VALUES (, 'user_adjustment', $2, $3)`,
        [stoneId, userSelectedPrice, `User adjusted from AI suggestion of ${aiSuggestion.medium} VNĐ`]
    );
}

/**
 * VII. RE-QUERYING – AI SUGGESTS UPDATED PRICES
 */
export async function getUpdatedPricing(stoneId: number) {
    const stoneData = await db.query(
        `SELECT s.id, s.image_path, s.individual_import_price, s.warehouse_entry_date, s.user_selected_price,
                b.stone_type
         FROM stones s
         JOIN batches b ON s.batch_id = b.id
         WHERE s.id = `,
        [stoneId]
    );

    if (stoneData.rows.length === 0) throw new Error('Stone not found');
    const stone = stoneData.rows[0];

    const priceHistory = await db.query('SELECT * FROM stone_price_history WHERE stone_id =  ORDER BY created_at DESC', [stoneId]);
    const storageDuration = Math.floor((new Date().getTime() - new Date(stone.warehouse_entry_date).getTime()) / (1000 * 60 * 60 * 24));
    const currentTrend = await getCurrentMarketTrend(stone.stone_type);
    
    // Generate new pricing suggestion using the refactored engine
    const newSuggestion = await generateAIPriceSuggestion(stoneId);

    const inflationAdjustedImportPrice = calculateInflationAdjustment(parseFloat(stone.individual_import_price), new Date(stone.warehouse_entry_date));

    return {
        stone: {
            id: stone.id,
            stone_type: stone.stone_type,
            image_path: stone.image_path,
        },
        pricing: {
            original_purchase_price: parseFloat(stone.individual_import_price),
            previous_selling_price: stone.user_selected_price ? parseFloat(stone.user_selected_price) : null,
            storage_duration_days: storageDuration,
            current_market_trend: currentTrend,
            minimum_price: Math.round(inflationAdjustedImportPrice / 1000) * 1000,
            reasonable_price: newSuggestion.medium,
            profit_optimized_price: newSuggestion.high,
            suggestion_reason: newSuggestion.reason,
            characteristics: newSuggestion.characteristics,
        },
        price_history: priceHistory.rows,
    };
}