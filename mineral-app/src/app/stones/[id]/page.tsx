'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

interface StoneDetails {
    stone: {
        id: number;
        stone_type: string;
        quality_score: number;
        weight: number;
        dimensions: string;
        image_path: string;
    };
    pricing: {
        original_purchase_price: number;
        previous_selling_prices: number[];
        storage_duration_days: number;
        current_market_trend: any;
        minimum_price: number;
        reasonable_price: number;
        profit_optimized_price: number;
        suggestion_reason: string;
    };
    price_history: any[];
}

interface PricingSuggestion {
    low: number;
    medium: number;
    high: number;
    reason: string;
    characteristics: {
        clarity: number;
        color: number;
        inclusions: number;
        rarity: number;
    };
}

export default function StonePage() {
    const params = useParams();
    const stoneId = params.id as string;

    const [stoneDetails, setStoneDetails] = useState<StoneDetails | null>(null);
    const [pricingSuggestion, setPricingSuggestion] = useState<PricingSuggestion | null>(null);
    const [userPrice, setUserPrice] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPriceAdjustment, setShowPriceAdjustment] = useState(false);

    useEffect(() => {
        fetchStoneDetails();
        fetchAIPriceSuggestion();
    }, [stoneId]);

    const fetchStoneDetails = async () => {
        try {
            const response = await fetch(`/api/stones/${stoneId}`);
            if (!response.ok) throw new Error('Failed to fetch stone details');
            const data = await response.json();
            setStoneDetails(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const fetchAIPriceSuggestion = async () => {
        try {
            const response = await fetch(`/api/stones/${stoneId}/pricing`);
            if (!response.ok) throw new Error('Failed to fetch AI pricing');
            const data = await response.json();
            setPricingSuggestion(data);
            setUserPrice(data.medium.toString());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePriceAdjustment = async () => {
        if (!pricingSuggestion || !userPrice) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/stones/${stoneId}/adjust-price`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ai_suggestion: pricingSuggestion,
                    user_selected_price: parseFloat(userPrice)
                })
            });

            if (!response.ok) throw new Error('Failed to save price adjustment');

            // Refresh data
            await fetchStoneDetails();
            setShowPriceAdjustment(false);
            alert('Giá đã được cập nhật và AI đã học từ quyết định của bạn!');

        } catch (err) {
            alert(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Đang tải thông tin viên đá...</p>
                </div>
            </div>
        );
    }

    if (error || !stoneDetails || !pricingSuggestion) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Không tìm thấy thông tin viên đá'}</p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const { stone, pricing } = stoneDetails;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-4xl mx-auto px-4">

                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-start space-x-6">
                        <div className="flex-shrink-0">
                            <Image
                                src={stone.image_path}
                                alt={stone.stone_type}
                                width={200}
                                height={200}
                                className="w-48 h-48 object-cover rounded-lg"
                            />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {stone.stone_type}
                            </h1>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Chất lượng AI:</span>
                                    <span className="ml-2 font-medium">{(stone.quality_score * 100).toFixed(0)}%</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Trọng lượng:</span>
                                    <span className="ml-2 font-medium">{stone.weight}g</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Kích thước:</span>
                                    <span className="ml-2 font-medium">{stone.dimensions}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Lưu kho:</span>
                                    <span className="ml-2 font-medium">{pricing.storage_duration_days} ngày</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Price Suggestion Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        II. AI INITIAL PRICE SUGGESTION (NOT A DECISION)
                    </h2>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800 dark:text-yellow-200 font-medium text-center">
                            ⚠️ This price is a suggestion. You make the final decision.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Giá thấp</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {new Intl.NumberFormat('vi-VN').format(pricingSuggestion.low)} VNĐ
                            </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Giá trung bình</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {new Intl.NumberFormat('vi-VN').format(pricingSuggestion.medium)} VNĐ
                            </p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Giá cao</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {new Intl.NumberFormat('vi-VN').format(pricingSuggestion.high)} VNĐ
                            </p>
                        </div>
                    </div>

                    {/* Image Analysis Results */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Phân tích hình ảnh AI:</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                                <span>Độ trong suốt:</span>
                                <span className="font-medium">{(pricingSuggestion.characteristics.clarity * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Màu sắc:</span>
                                <span className="font-medium">{(pricingSuggestion.characteristics.color * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tạp chất:</span>
                                <span className="font-medium">{(pricingSuggestion.characteristics.inclusions * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Độ hiếm:</span>
                                <span className="font-medium">{(pricingSuggestion.characteristics.rarity * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Lý do:</strong> {pricingSuggestion.reason}
                        </p>
                    </div>
                </div>

                {/* User Price Adjustment Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        III. USER PRICE ADJUSTMENT (EXTREMELY IMPORTANT)
                    </h2>

                    {!showPriceAdjustment ? (
                        <button
                            onClick={() => setShowPriceAdjustment(true)}
                            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                        >
                            Điều chỉnh giá bán
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Giá bán mong muốn (VNĐ)
                                </label>
                                <input
                                    type="number"
                                    value={userPrice}
                                    onChange={(e) => setUserPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Nhập giá bán của bạn"
                                />
                            </div>

                            {userPrice && pricingSuggestion && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        Chênh lệch với AI: {(((parseFloat(userPrice) - pricingSuggestion.medium) / pricingSuggestion.medium) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            )}

                            <div className="flex space-x-3">
                                <button
                                    onClick={handlePriceAdjustment}
                                    disabled={isSaving || !userPrice}
                                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Đang lưu...' : 'Lưu giá & Huấn luyện AI'}
                                </button>
                                <button
                                    onClick={() => setShowPriceAdjustment(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Current Pricing Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        VII. RE-QUERYING – AI SUGGESTS UPDATED PRICES
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Giá tối thiểu (không lỗ)</p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400">
                                {new Intl.NumberFormat('vi-VN').format(pricing.minimum_price)} VNĐ
                            </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Giá hợp lý</p>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {new Intl.NumberFormat('vi-VN').format(pricing.reasonable_price)} VNĐ
                            </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Giá tối ưu lợi nhuận</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                {new Intl.NumberFormat('vi-VN').format(pricing.profit_optimized_price)} VNĐ
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Giá nhập gốc:</span>
                                <span className="ml-2 font-medium">
                                    {new Intl.NumberFormat('vi-VN').format(pricing.original_purchase_price)} VNĐ
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Thời gian lưu kho:</span>
                                <span className="ml-2 font-medium">{pricing.storage_duration_days} ngày</span>
                            </div>
                            {pricing.current_market_trend && (
                                <div className="md:col-span-2">
                                    <span className="text-gray-500 dark:text-gray-400">Xu hướng thị trường:</span>
                                    <span className="ml-2 font-medium">
                                        {pricing.current_market_trend.trend} {pricing.current_market_trend.percentage_change > 0 ? '+' : ''}
                                        {pricing.current_market_trend.percentage_change}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Price History */}
                {stoneDetails.price_history.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Lịch sử thay đổi giá
                        </h2>
                        <div className="space-y-3">
                            {stoneDetails.price_history.map((entry, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {entry.price_type === 'user_adjustment' ? 'Điều chỉnh của người dùng' :
                                                entry.price_type === 'market_update' ? 'Cập nhật thị trường' : 'Đề xuất AI'}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{entry.reason}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('vi-VN').format(entry.new_price)} VNĐ
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(entry.created_at).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}