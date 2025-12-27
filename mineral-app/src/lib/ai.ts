import { pipeline, RawImage } from '@xenova/transformers';
import pgvector from 'pgvector/pg';
import type { DatabaseConnection } from '../types/database';

// --- Cấu hình Singleton Pattern cho pipeline ---
class EmbeddingPipeline {
    static task = 'image-feature-extraction';
    static model = 'Xenova/clip-vit-base-patch16';
    static instance: ReturnType<typeof pipeline> | null = null;
    static async getInstance(progress_callback?: (p: any) => void) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, { progress_callback, quantized: false });
        }
        return this.instance;
    }
}

class ZeroShotObjectDetectionPipeline {
    static task = 'zero-shot-object-detection';
    static model = 'Xenova/owlvit-base-patch32';
    static instance: ReturnType<typeof pipeline> | null = null;
    static async getInstance(progress_callback?: (p: any) => void) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, { progress_callback, quantized: false });
        }
        return this.instance;
    }
}

class QualityPipeline {
    static task = 'image-feature-extraction';
    static model = 'Xenova/clip-vit-base-patch32'; // Smaller model for quality check
    static instance: ReturnType<typeof pipeline> | null = null;
    static async getInstance(progress_callback?: (p: any) => void) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, { progress_callback, quantized: true });
        }
        return this.instance;
    }
}


const getFullUrl = (imagePath: string) => new URL(imagePath, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').toString();

/**
 * Evaluates the quality of a stone from an image.
 * @param imagePath The path to the image.
 * @returns An object containing the quality score, confidence, and descriptive features.
 */
export async function evaluateStoneQuality(imagePath: string | RawImage): Promise<{
  quality: number;
  confidence: number;
  features: string[];
}> {
  try {
    const extractor = await QualityPipeline.getInstance();
    
    let image: RawImage;
    if (typeof imagePath === 'string') {
        image = await RawImage.fromURL(getFullUrl(imagePath));
    } else {
        image = imagePath;
    }

    const output = await extractor(image, { pooling: 'mean', normalize: true });
    const features = output.data as number[];

    const complexity = features.reduce((sum, val) => sum + Math.abs(val), 0) / features.length;
    const variance = features.reduce((sum, val) => sum + val * val, 0) / features.length - complexity * complexity;

    const quality = Math.min(1, Math.max(0, (complexity + variance) / 2));
    const confidence = 0.7; 

    const features_desc = [];
    if (quality > 0.8) features_desc.push('very high quality');
    else if (quality > 0.6) features_desc.push('high quality');
    else if (quality > 0.4) features_desc.push('average quality');
    else features_desc.push('below average quality');
    else features_desc.push('low quality');

    return { quality, confidence, features: features_desc };

  } catch (error) {
    console.error('Quality evaluation failed:', error);
    return { quality: 0.5, confidence: 0.5, features: ['could not be evaluated'] };
  }
}


export async function detectAndCropStones(imagePath: string): Promise<{ blob: Blob; box: any }[]> {
    try {
        const detector = await ZeroShotObjectDetectionPipeline.getInstance();
        const image = await RawImage.fromURL(getFullUrl(imagePath));
        const queries = ['stone', 'crystal', 'mineral', 'rock', 'gemstone'];
        const detectionResults = await detector(image, queries);
        const filteredResults = detectionResults.filter((result: { score: number }) => result.score > 0.15);

        if (filteredResults.length === 0) return [];

        const croppedBlobs = [];
        for (const result of filteredResults) {
            const croppedImage = image.crop(result.box.xmin, result.box.ymin, result.box.xmax, result.box.ymax);
            const blob = await croppedImage.toBlob('image/jpeg', 0.9);
            croppedBlobs.push({ blob, box: result.box });
        }
        return croppedBlobs;

    } catch (error) {
        console.error('Error detecting and cropping stones:', error);
        return [];
    }
}

export async function getEmbedding(imagePath: string | RawImage): Promise<number[]> {
    try {
        const extractor = await EmbeddingPipeline.getInstance();
        
        let image: RawImage;
        if (typeof imagePath === 'string') {
            image = await RawImage.fromURL(getFullUrl(imagePath));
        } else {
            image = imagePath;
        }

        const output = await extractor(image, { pooling: 'mean', normalize: true });
        let data = Array.from(output.data);

        const expectedDimensions = 512;
        if (data.length !== expectedDimensions) {
            console.warn(`Generated embedding has ${data.length} dimensions, expected ${expectedDimensions}`);
            data = data.slice(0, expectedDimensions);
            while (data.length < expectedDimensions) {
                data.push(0);
            }
        }
        return data;

    } catch (error) {
        console.error('Error generating embedding:', error);
        return new Array(512).fill(0);
    }
}

export async function updateImageEmbedding(db: DatabaseConnection, stoneId: number, embedding: number[]) {
    try {
        const expectedDimensions = 512;
        if (embedding.length !== expectedDimensions) {
            embedding = embedding.slice(0, expectedDimensions);
            while (embedding.length < expectedDimensions) {
                embedding.push(0);
            }
        }
        await db.query('UPDATE stones SET embedding = $1 WHERE id = $2', [pgvector.toSql(embedding), stoneId]);
    } catch (error) {
        console.error('Failed to update stone embedding:', error);
        throw error;
    }
}

