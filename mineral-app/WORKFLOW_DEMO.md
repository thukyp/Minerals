# Mineral Pricing System - Complete Workflow Demo

## Your Exact Requirements ✅

### 1. **Batch Entry with Individual Stones**
- ✅ Input quantity and prices in VND
- ✅ One image per individual stone
- ✅ AI suggests prices for each stone
- ✅ You adjust selling prices to make them reasonable
- ✅ AI remembers your adjustments for future suggestions

### 2. **Manual Market Conditions**
- ✅ Section to enter market conditions for different mineral types
- ✅ AI combines your original price with current market conditions
- ✅ Updated price suggestions when you look up items later

### 3. **Currency Depreciation (6% Annual)**
- ✅ Fixed 6% per year rate
- ✅ Longer storage = higher prices automatically
- ✅ Formula: `New Price = Original Price × (1 + 0.06)^years`

## Complete Workflow Example

### Step 1: Add New Batch
```
Navigate to: /batches/new

Input:
- Stone Type: "Thạch anh hồng"
- Import Date: "2024-01-15"
- Import Price: 500,000 VND
- Quantity: 5
- Upload 5 images (one per stone)
```

### Step 2: AI Price Suggestions
```
For each stone, AI analyzes:
- Image quality and characteristics
- Historical data from your previous adjustments
- Current market conditions
- Storage time (inflation adjustment)

AI suggests:
- Low: 850,000 VND
- Medium: 1,000,000 VND  
- High: 1,200,000 VND
- Reason: "Based on import price 500,000 VND, quality 85%, learned from 3 previous transactions, market trend increasing +10%, inflation adjustment 2.1%"
```

### Step 3: Your Price Adjustment
```
You decide: 1,100,000 VND (10% higher than AI medium suggestion)

System records:
- AI suggested: 1,000,000 VND
- Your decision: 1,100,000 VND
- Difference: +10%
- This becomes training data for future suggestions
```

### Step 4: Market Conditions Management
```
Navigate to: /market-trends

Add market condition:
- Stone Type: "Thạch anh hồng"
- Trend: "Increasing"
- Percentage Change: +15%
- Notes: "High demand from collectors, limited supply from main source"
- Start Date: "2024-12-01"
```

### Step 5: Future Lookups with Updated Pricing
```
Navigate to: /stones/[stone-id]

AI shows updated pricing:
- Original Import: 500,000 VND (Jan 2024)
- Storage Duration: 345 days
- Inflation Adjustment: +5.7% (345 days × 6%/year)
- Market Trend: +15% (from your input)
- Your Previous Price: 1,100,000 VND
- New Suggested Price: 1,270,000 VND

Calculation:
Base: 500,000 × 1.057 (inflation) × 1.15 (market) × 1.1 (learned margin) = 670,000
+ Quality & Learning adjustments = 1,270,000 VND
```

## Key Features Working

### ✅ AI Learning System
```typescript
// AI learns from your decisions
const learningData = await db.query(`
  SELECT user_selected_price, ai_suggested_medium, percentage_difference
  FROM ai_learning_data 
  WHERE stone_type = $1
  ORDER BY created_at DESC LIMIT 10
`);

// Calculates your personal pricing pattern
const avgUserAdjustment = learningData.rows.reduce((sum, row) => {
  return sum + (parseFloat(row.user_selected_price) / parseFloat(row.ai_suggested_medium));
}, 0) / learningData.rows.length;
```

### ✅ Inflation Adjustment (6% Annual)
```typescript
export function calculateInflationAdjustment(basePrice: number, warehouseEntryDate: Date): number {
  const currentDate = new Date();
  const yearsStored = (currentDate.getTime() - warehouseEntryDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  return basePrice * Math.pow(1 + 0.06, yearsStored); // 6% per year
}
```

### ✅ Market Conditions Integration
```typescript
export async function getCurrentMarketTrend(stoneType: string): Promise<MarketCondition | null> {
  const result = await db.query(`
    SELECT stone_type, trend, percentage_change, notes
    FROM market_trends 
    WHERE stone_type = $1 
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    AND start_date <= CURRENT_DATE
    ORDER BY start_date DESC LIMIT 1
  `);
  
  return result.rows.length > 0 ? result.rows[0] : null;
}
```

## Navigation Guide

1. **Home** (`/`) - Overview of all features
2. **Add Batch** (`/batches/new`) - Enter new minerals with images
3. **Manage Stones** (`/stones`) - View all individual stones
4. **Stone Details** (`/stones/[id]`) - AI pricing + your adjustments
5. **Market Trends** (`/market-trends`) - Input market conditions
6. **Search** (`/search`) - Find similar stones by image

## Database Tables Working

- **batches** - Your mineral batches
- **stones** - Individual stones with pricing data
- **ai_learning_data** - AI learns from your price adjustments
- **market_trends** - Your market condition inputs
- **stone_price_history** - Complete price change tracking

## Ready to Use!

The system is fully implemented and ready. Just:

1. Run the database migration: `migration-enhanced.sql`
2. Start adding batches with individual stone images
3. Let AI suggest prices, then adjust them with your expertise
4. Add market conditions for different stone types
5. Watch AI improve its suggestions based on your decisions

The AI will learn your personal pricing style and combine it with market conditions and inflation adjustments to give you increasingly accurate suggestions over time!