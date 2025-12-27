# Enhanced Mineral AI Pricing System

## Overview

This is a comprehensive mineral inventory and AI-powered pricing system that follows a strict specification for learning from user behavior and providing intelligent pricing suggestions.

## Core System Architecture

### I. INITIAL DATA INPUT (MANDATORY)
- **Individual Stone Tracking**: Each stone is tracked separately with its own image and characteristics
- **Batch Management**: Stones are organized into batches for import tracking
- **Required Data**: Mineral name, category, weight/size, quantity, purchase cost, individual images, warehouse entry date
- **Ground Truth**: This data serves as the foundation for AI learning

### II. AI INITIAL PRICE SUGGESTION (NOT A DECISION)
- **Image Analysis**: AI analyzes clarity, color, inclusions, and relative rarity
- **Price Range**: Provides low, medium, and high suggested prices
- **Clear Disclaimer**: "This price is a suggestion. You make the final decision."
- **Learning Base**: Uses historical data and image characteristics

### III. USER PRICE ADJUSTMENT (EXTREMELY IMPORTANT)
- **User Control**: User inputs their desired selling price
- **Learning Data**: System stores AI suggestion vs user decision
- **Percentage Tracking**: Records the difference for AI improvement
- **Real Learning**: This is the actual training data for the AI

### IV. AI MEMORY & CONTINUOUS LEARNING (LEARNING LOOP)
- **Pattern Recognition**: AI learns user's personal pricing patterns
- **Gradual Improvement**: Reduces "stupid suggestions" over time
- **User-Specific**: Learns individual selling style, not generic market prices
- **Historical Analysis**: Uses past user decisions to improve future suggestions

### V. MANUAL MARKET CONDITION INPUT (VERY REALISTIC)
- **Market Trends**: Users input increasing/decreasing/stable trends
- **Percentage Changes**: Specific percentage adjustments (e.g., +5%, -3%)
- **Detailed Notes**: Collector trends, scarcity, hype factors
- **Price Adjustment**: AI applies these factors to pricing calculations

### VI. TIME-BASED & INFLATION PRICING (MANDATORY)
- **Fixed Inflation**: 6% per year currency depreciation
- **Formula**: Current price = Base price × (1 + 0.06)^years
- **Storage Duration**: Longer storage automatically increases minimum price
- **Combined Factors**: User price + market adjustment + time adjustment

### VII. RE-QUERYING – AI SUGGESTS UPDATED PRICES
- **Historical Display**: Shows original purchase price and previous selling prices
- **Storage Duration**: Displays how long item has been in storage
- **Market Context**: Current market trend information
- **Price Options**: Minimum (no loss), reasonable, and profit-optimized prices
- **User Decision**: Final pricing decision always remains with user

### VIII. CORE PRINCIPLES (DO NOT BREAK)
- ✅ AI must not sell automatically
- ✅ AI must not override user prices
- ✅ AI learns from user decisions only
- ✅ Market price = reference, not absolute truth

## Technical Implementation

### Database Schema
- **batches**: Mineral batch information
- **stones**: Individual stone records with pricing data
- **ai_learning_data**: AI training data from user decisions
- **stone_price_history**: Price change tracking
- **market_trends**: User-input market conditions
- **sales_history**: Completed transactions

### AI Components
- **CLIP Model**: Image analysis for similarity and quality assessment
- **Pricing Engine**: Combines multiple factors for price suggestions
- **Learning System**: Improves suggestions based on user feedback
- **Market Integration**: Applies user-defined market conditions

### Key Features
1. **Individual Stone Management**: Each stone tracked separately
2. **AI Price Suggestions**: Low/medium/high price ranges
3. **User Price Adjustment**: Learning from user decisions
4. **Market Trend Integration**: User-defined market conditions
5. **Inflation Adjustment**: Automatic 6% annual adjustment
6. **Price History**: Complete tracking of price changes
7. **Quality Assessment**: AI-based image quality scoring
8. **Search by Image**: Vector similarity search
9. **Sales Management**: Transaction recording and analytics

## Usage Workflow

1. **Add New Batch**: Create batch with stone type, import info
2. **Upload Images**: One image per stone for AI analysis
3. **AI Analysis**: System generates price suggestions
4. **User Decision**: Adjust prices based on your expertise
5. **Market Updates**: Input current market conditions
6. **Re-pricing**: Get updated suggestions over time
7. **Sales Recording**: Track actual selling prices for AI learning

## API Endpoints

### Stone Management
- `GET /api/stones` - List all stones
- `GET /api/stones/[id]` - Get stone details with updated pricing
- `GET /api/stones/[id]/pricing` - Get AI price suggestions
- `POST /api/stones/[id]/adjust-price` - Record user price adjustment

### Market Trends
- `GET /api/market-trends` - List market trends
- `POST /api/market-trends` - Add new market trend
- `PUT /api/market-trends/[id]` - Update market trend
- `DELETE /api/market-trends/[id]` - Delete market trend

### Batch Management
- `POST /api/batches` - Create new batch
- `POST /api/stones` - Add stone to batch

## Environment Setup

### Required Environment Variables
```
POSTGRES_URL=your_postgresql_connection_string
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
NODE_ENV=development_or_production
```

### Database Setup
1. Run `schema.sql` to create initial tables
2. Run `migration-enhanced.sql` to add enhanced features
3. Ensure pgvector extension is enabled

### Development
```bash
cd mineral-app
npm install
npm run dev
```

### Production Deployment
- Configured for Vercel deployment
- Automatic Vercel Blob storage integration
- PostgreSQL with pgvector support required

## Key Differentiators

1. **User-Centric Learning**: AI learns from YOUR pricing decisions, not generic market data
2. **Individual Stone Focus**: Each stone is managed separately with its own pricing history
3. **Mandatory Inflation**: Built-in 6% annual adjustment ensures no losses over time
4. **Market Reality**: User inputs real market conditions rather than automated scraping
5. **Price Transparency**: Clear distinction between AI suggestions and user decisions
6. **Learning Feedback**: System shows how AI accuracy improves over time

## Future Enhancements

### Phase 1: Advanced Analytics
- Profitability analysis dashboards
- AI accuracy tracking over time
- Market trend visualization

### Phase 2: Mobile Application
- Native mobile app for inventory management
- Camera integration for quick image capture
- Offline capability for field work

### Phase 3: Multi-User Support
- Team collaboration features
- Role-based permissions
- Shared learning across team members

## Support

For technical issues or feature requests, please refer to the development documentation or contact the development team.

---

**Remember**: This system is designed to enhance your expertise, not replace it. The AI learns from your decisions to become a better assistant over time.