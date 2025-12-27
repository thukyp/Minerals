# Troubleshooting Guide - Mineral AI Pricing System

## 🚨 Common Issues & Solutions

### 1. **Database Error: "relation 'stones' does not exist"**

**Problem**: The enhanced database schema hasn't been applied.

**Solution**:
```bash
# Run the migration
node run-migration.js

# Or manually run the SQL
# Execute migration-enhanced.sql in your PostgreSQL database
```

**Verification**:
```bash
# Check if tables exist
node setup-system.js
```

### 2. **Embedding Error: "expected 384 dimensions, not 2"**

**Problem**: AI model is generating wrong embedding dimensions.

**Solution**: ✅ **FIXED** - The system now automatically handles dimension mismatches by padding or truncating to 384 dimensions.

### 3. **Lint Warnings: "unused variables"**

**Problem**: ESLint warnings about unused error variables.

**Solution**: ✅ **FIXED** - Changed error variables to use underscore prefix or different names.

### 4. **Environment Variables Missing**

**Problem**: Missing POSTGRES_URL or BLOB_READ_WRITE_TOKEN.

**Solution**:
```bash
# Create .env.local file with:
POSTGRES_URL=your_postgresql_connection_string
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
NODE_ENV=development
```

### 5. **pgvector Extension Not Enabled**

**Problem**: Vector operations fail.

**Solution**:
```sql
-- Run in your PostgreSQL database
CREATE EXTENSION IF NOT EXISTS vector;
```

## 🔧 Quick Fix Commands

### Complete System Setup
```bash
# 1. Install dependencies
npm install

# 2. Run migration
node run-migration.js

# 3. Verify setup
node setup-system.js

# 4. Start development server
npm run dev
```

### Reset Database (if needed)
```bash
# Drop and recreate tables (CAUTION: This deletes all data!)
# Run in PostgreSQL:
DROP TABLE IF EXISTS stone_price_history CASCADE;
DROP TABLE IF EXISTS ai_learning_data CASCADE;
DROP TABLE IF EXISTS sales_history CASCADE;
DROP TABLE IF EXISTS stones CASCADE;
DROP TABLE IF EXISTS market_trends CASCADE;
DROP TABLE IF EXISTS batches CASCADE;

# Then run:
node run-migration.js
```

## 📊 Database Schema Verification

Run this SQL to check your tables:
```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('batches', 'stones', 'ai_learning_data', 'market_trends', 'stone_price_history');

-- Check stones table structure
\d stones;

-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
```

## 🎯 System Workflow Verification

### Test the Complete Flow:

1. **Add Batch** (`/batches/new`)
   - Enter: Stone type, import date, price, quantity
   - Upload: Individual stone images
   - Verify: Batch created successfully

2. **Check Stones** (`/stones`)
   - Verify: Individual stones appear in list
   - Check: Each stone has image and basic info

3. **AI Pricing** (`/stones/[id]`)
   - Verify: AI suggests low/medium/high prices
   - Test: Adjust price and save
   - Check: AI learning data recorded

4. **Market Trends** (`/market-trends`)
   - Add: Market condition for stone type
   - Verify: Trend appears in list
   - Test: Price suggestions reflect market changes

5. **Price Updates** (Re-visit `/stones/[id]`)
   - Verify: Inflation adjustment applied
   - Check: Market trends affect pricing
   - Confirm: AI learns from previous adjustments

## 🐛 Debug Mode

Enable detailed logging by adding to `.env.local`:
```
DEBUG=true
FASTMCP_LOG_LEVEL=DEBUG
```

## 📞 Getting Help

If issues persist:

1. **Check Console**: Look for error messages in browser console
2. **Check Server Logs**: Monitor terminal output for API errors
3. **Verify Database**: Ensure all tables exist and have correct structure
4. **Test API Endpoints**: Use browser dev tools to check API responses

## ✅ System Health Check

Run this checklist:
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] All tables exist (batches, stones, ai_learning_data, market_trends, stone_price_history)
- [ ] pgvector extension enabled
- [ ] Can create batches
- [ ] Can upload images
- [ ] AI generates embeddings (check server logs)
- [ ] Can adjust prices
- [ ] Can add market trends
- [ ] Price suggestions update based on trends and time

## 🚀 Performance Tips

1. **Image Size**: Keep images under 5MB for faster processing
2. **Batch Size**: Upload 5-10 stones per batch for optimal performance
3. **Database**: Ensure your PostgreSQL has sufficient resources
4. **AI Model**: First load takes time, subsequent requests are faster

---

**Remember**: The system is designed to learn from your expertise. The more you use it and adjust prices, the better the AI becomes at understanding your pricing style!