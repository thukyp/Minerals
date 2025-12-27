// Database type definitions for the mineral system

export interface DatabaseConnection {
    query: (text: string, params?: any[]) => Promise<any>;
}

export interface Batch {
    id: number;
    stone_type: string;
    variety?: string;
    import_date: string;
    import_price: number;
    quantity: number;
    notes?: string;
    created_at: string;
}

export interface Stone {
    id: number;
    batch_id: number;
    weight?: number;
    dimensions?: string;
    quality_score: number;
    image_path: string;
    embedding?: number[];
    ai_suggested_low?: number;
    ai_suggested_medium?: number;
    ai_suggested_high?: number;
    user_selected_price?: number;
    price_adjustment_percentage?: number;
    warehouse_entry_date: string;
    is_sold: boolean;
    created_at: string;
}

export interface AILearningData {
    id: number;
    stone_id: number;
    stone_type: string;
    image_characteristics?: any;
    ai_suggested_price: number;
    user_selected_price: number;
    percentage_difference: number;
    quality_score?: number;
    market_conditions?: any;
    created_at: string;
}

export interface MarketTrend {
    id: number;
    stone_type: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    percentage_change: number;
    notes?: string;
    start_date: string;
    end_date?: string;
    created_at: string;
}

export interface SalesHistory {
    id: number;
    stone_id?: number;
    batch_id: number;
    stone_type: string;
    variety?: string;
    weight?: number;
    dimensions?: string;
    quantity_sold: number;
    ai_suggested_price: number;
    real_selling_price: number;
    selling_date: string;
    quality_score?: number;
    notes?: string;
    created_at: string;
}

export interface StonePriceHistory {
    id: number;
    stone_id: number;
    price_type: 'ai_suggestion' | 'user_adjustment' | 'market_update';
    old_price?: number;
    new_price: number;
    reason?: string;
    created_at: string;
}