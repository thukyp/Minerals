import { db } from '@/lib/db';
import { getEmbedding, evaluateStoneQuality } from '@/lib/ai';
import { NextResponse } from 'next/server';
import pgvector from 'pgvector/pg';
import { promises as fs } from 'fs';
import path from 'path';
import { pipeline, RawImage } from '@xenova/transformers';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const stoneType = formData.get('stone_type') as string;
    const quantity = parseInt(formData.get('quantity') as string);
    const importPrice = parseFloat(formData.get('import_price') as string);
    const weight = parseFloat(formData.get('weight') as string);
    const dimensions = formData.get('dimensions') as string;
    const importDate = formData.get('import_date') as string;
    const images = formData.getAll('images') as File[];

    if (!stoneType || !quantity || !importPrice || !weight || !dimensions || images.length === 0) {
      return new NextResponse('Missing required fields: stone_type, quantity, import_price, weight, dimensions, images', { status: 400 });
    }

    // Generate embeddings for all input images
    const embeddings: number[][] = [];
    const tempFiles: string[] = [];

    for (const image of images) {
      const filename = `temp-${Date.now()}-${Math.random()}.jpg`;
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, filename);
      const arrayBuffer = await image.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));
      const imageUrl = `/uploads/${filename}`;
      tempFiles.push(filePath);

      // Generate a real embedding
      const embedding = await getEmbedding(imageUrl);
      embeddings.push(embedding);
    }

    // Average the embeddings if multiple
    const avgEmbedding = embeddings[0].map((_, i) =>
      embeddings.reduce((sum, emb) => sum + emb[i], 0) / embeddings.length
    );

    // Find similar SOLD images to get a visual market price
    const embeddingSql = pgvector.toSql(avgEmbedding);
    const similarStonesResult = await db.query(
      `SELECT
         sh.real_selling_price / sh.quantity_sold as unit_price,
         s.embedding <=> $1 AS distance
       FROM stones s
       JOIN sales_history sh ON s.id = sh.stone_id
       WHERE s.is_sold = TRUE AND sh.real_selling_price IS NOT NULL AND sh.quantity_sold > 0
       ORDER BY distance ASC
       LIMIT 5`,
      [embeddingSql]
    );

    let visualMarketPrice = 0;
    if (similarStonesResult.rows.length > 0) {
      const total = similarStonesResult.rows.reduce((sum, row) => sum + parseFloat(row.unit_price), 0);
      visualMarketPrice = total / similarStonesResult.rows.length;
      console.log(`Calculated Visual Market Price from ${similarStonesResult.rows.length} similar stones: ${visualMarketPrice}`);
    }

    // Phân tích chất lượng từng viên đá
    const stoneAnalyses: Array<{
      imageIndex: number;
      quality: number;
      confidence: number;
      features: string[];
      suggestedPrice: number;
      imageUrl: string;
    }> = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const tempFile = tempFiles[i];
      const imageUrl = `/uploads/${path.basename(tempFile)}`;

      // Đánh giá chất lượng
      const qualityAnalysis = await evaluateStoneQuality(tempFile);

      stoneAnalyses.push({
        imageIndex: i,
        quality: qualityAnalysis.quality,
        confidence: qualityAnalysis.confidence,
        features: qualityAnalysis.features,
        suggestedPrice: 0, // sẽ tính sau
        imageUrl
      });
    }

    // Tính giá cơ bản từ dữ liệu lịch sử (sử dụng dữ liệu học được)
    let baseMargin = 1.8; // biên lợi nhuận mặc định

    // Lấy dữ liệu học được từ lịch sử bán hàng
    const salesStats = await db.query(`
      SELECT
        AVG(real_selling_price / NULLIF(import_price, 0)) as learned_margin,
        AVG(real_selling_price) as avg_market_price,
        COUNT(*) as sample_size
      FROM sales_history sh
      JOIN batches b ON sh.batch_id = b.id
      WHERE b.stone_type = $1
      AND sh.selling_date >= CURRENT_DATE - INTERVAL '180 days'
    `, [stoneType]);

    if (salesStats.rows[0].sample_size > 0) {
      // Sử dụng dữ liệu học được nếu có đủ mẫu
      const learnedMargin = salesStats.rows[0].learned_margin;
      if (learnedMargin && learnedMargin > 0) {
        baseMargin = learnedMargin;
        console.log(`Using learned margin for ${stoneType}: ${baseMargin}`);
      }
    }

    // Áp dụng xu hướng thị trường
    const marketTrends = await db.query(`
      SELECT trend, intensity
      FROM market_trends
      WHERE stone_type = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [stoneType]);

    if (marketTrends.rows.length > 0) {
      const trend = marketTrends.rows[0];
      let trendMultiplier = 1.0;

      if (trend.trend === 'up') {
        trendMultiplier = trend.intensity === 'nhẹ' ? 1.05 :
                          trend.intensity === 'vừa' ? 1.10 : 1.15;
      } else if (trend.trend === 'down') {
        trendMultiplier = trend.intensity === 'nhẹ' ? 0.95 :
                          trend.intensity === 'vừa' ? 0.90 : 0.85;
      }

      baseMargin *= trendMultiplier;
      console.log(`Applied market trend for ${stoneType}: ${trend.trend} ${trend.intensity} (${trendMultiplier}x)`);
    }

    // Áp dụng lạm phát 6% mỗi năm (tính từ ngày nhập hàng đến hiện tại)
    const currentDate = new Date();
    const inflationRate = 0.06; // 6% per year

    const importDateObj = importDate ? new Date(importDate) : new Date();
    const yearsDiff = (currentDate.getTime() - importDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (yearsDiff > 0) {
      const inflationMultiplier = Math.pow(1 + inflationRate, yearsDiff);
      baseMargin *= inflationMultiplier;
      console.log(`Applied inflation adjustment: ${inflationMultiplier.toFixed(3)}x (${yearsDiff.toFixed(2)} years)`);
    }

    // Điều chỉnh biên lợi nhuận theo số lượng
    if (quantity > 100) {
      baseMargin *= 0.95;
    }

    // Tính giá nhập mỗi viên
    const importPricePerStone = importPrice / quantity;

    // Tính giá cơ bản dựa trên biên lợi nhuận lịch sử
    let basePrice = importPricePerStone * baseMargin;

    // Trộn giá thị trường trực quan vào giá cơ bản nếu có
    if (visualMarketPrice > 0) {
      basePrice = (basePrice * 0.7) + (visualMarketPrice * 0.3);
      console.log(`Blended base price with visual market price: ${basePrice}`);
    }

    // Tính giá bán đề xuất cho từng viên dựa trên chất lượng
    let totalSuggestedPrice = 0;
    stoneAnalyses.forEach(stone => {
      // Điều chỉnh giá dựa trên chất lượng (0.5-1.5 lần giá cơ bản)
      const qualityMultiplier = 0.5 + (stone.quality * 1.0);
      const stoneSuggestedPrice = basePrice * qualityMultiplier;

      stone.suggestedPrice = Math.round(stoneSuggestedPrice / 1000) * 1000;
      totalSuggestedPrice += stone.suggestedPrice;
    });

    // Tính giá trung bình và khoảng
    const avgPricePerStone = totalSuggestedPrice / stoneAnalyses.length;
    const minPricePerStone = Math.min(...stoneAnalyses.map(s => s.suggestedPrice));
    const maxPricePerStone = Math.max(...stoneAnalyses.map(s => s.suggestedPrice));

    // Lưu vào database
    const perStoneImportPrice = importPrice / quantity;
    const warehouseEntryDate = new Date().toISOString().split('T')[0];

    // Tạo batch
    const batchResult = await db.query(
      `INSERT INTO batches (stone_type, import_date, import_price, quantity, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [stoneType, importDate || new Date().toISOString().split('T')[0], importPrice, quantity, `AI price suggestion generated on ${new Date().toISOString()}`]
    );
    const batchId = batchResult.rows[0].id;

    // Tạo stones
    for (let i = 0; i < stoneAnalyses.length; i++) {
      const stone = stoneAnalyses[i];
      const imagePath = stone.imageUrl; // /uploads/filename
      const embedding = embeddings[i]; // individual embedding

      await db.query(
        `INSERT INTO stones (batch_id, weight, dimensions, quality_score, image_path, embedding, ai_suggested_low, ai_suggested_medium, ai_suggested_high, individual_import_price, warehouse_entry_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          batchId,
          weight,
          dimensions,
          stone.quality,
          imagePath,
          pgvector.toSql(embedding),
          stone.suggestedPrice * 0.8, // low
          stone.suggestedPrice, // medium
          stone.suggestedPrice * 1.2, // high
          perStoneImportPrice,
          warehouseEntryDate
        ]
      );
    }

    // Clean up temp files
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
      } catch (e) {
        console.error('Failed to delete temp file:', e);
      }
    }

    return NextResponse.json({
      stones: stoneAnalyses,
      summary: {
        totalSuggestedPrice: Math.round(totalSuggestedPrice / 1000) * 1000,
        avgPricePerStone: Math.round(avgPricePerStone / 1000) * 1000,
        minPricePerStone,
        maxPricePerStone,
        totalStones: stoneAnalyses.length
      },
      reason: `Đã phân tích ${stoneAnalyses.length} viên đá riêng biệt. Giá đề xuất cho từng viên dựa trên chất lượng được đánh giá bởi AI, với biên lợi nhuận ${(baseMargin - 1) * 100}%.`,
      batchId
    });

  } catch (error) {
    console.error('Price suggestion failed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}