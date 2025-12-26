import { pipeline, RawImage } from '@xenova/transformers';
import pgvector from 'pgvector/pg';

// --- Cấu hình Singleton Pattern cho pipeline ---
// Điều này đảm bảo rằng chúng ta chỉ tải mô hình AI vào bộ nhớ một lần duy nhất,
// giúp tiết kiệm tài nguyên và tăng tốc độ xử lý cho các yêu cầu sau.
class EmbeddingPipeline {
    static task = 'image-feature-extraction';
    static model = 'Xenova/clip-vit-base-patch16'; // Model phù hợp cho image embedding
    static instance: any = null;

    static async getInstance(progress_callback?: Function) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, { 
                progress_callback,
                quantized: false, // Sử dụng full model để có độ chính xác cao hơn
            });
        }
        return this.instance;
    }
}

/**
 * Tạo vector embedding từ một URL hình ảnh.
 * @param url Đường dẫn URL của hình ảnh.
 * @returns Một vector (dưới dạng mảng số) đại diện cho hình ảnh.
 */
export async function getEmbedding(url: string): Promise<number[]> {
    try {
        const extractor = await EmbeddingPipeline.getInstance();
        
        // Tải ảnh từ URL và chuyển đổi thành đối tượng RawImage
        const image = await RawImage.fromURL(url);

        // Dùng mô hình AI để trích xuất đặc trưng (embedding)
        const output = await extractor(image, {
            pooling: 'mean',
            normalize: true,
        });

        // Chuyển đổi kết quả thành một mảng số thông thường
        // Kiểm tra xem output có phải là tensor hay không
        const data = output.data || output;
        return Array.from(data);
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Cập nhật cột embedding cho một ảnh trong cơ sở dữ liệu.
 * @param imageId ID của ảnh cần cập nhật.
 * @param embedding Vector embedding đã được tạo.
 */
export async function updateImageEmbedding(db: any, imageId: number, embedding: number[]) {
    await db.query(
        'UPDATE images SET embedding = $1 WHERE id = $2',
        [pgvector.toSql(embedding), imageId]
    );
}

