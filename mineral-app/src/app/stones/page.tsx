'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Stone {
    id: number;
    batch_id: number;
    stone_type: string;
    image_path: string;
    quality_score: number;
    weight: number;
    dimensions: string;
    warehouse_entry_date: string;
    individual_import_price: number;
    user_selected_price: number;
    ai_suggested_medium: number;
    is_sold: boolean;
    import_price: number;
    quantity: number;
}

export default function StonesPage() {
    const [stones, setStones] = useState<Stone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'price' | 'quality'>('date');

    useEffect(() => {
        fetchStones();
    }, []);

    const fetchStones = async () => {
        try {
            const response = await fetch('/api/stones');
            if (response.ok) {
                const data = await response.json();
                setStones(data);
            }
        } catch (error) {
            console.error('Error fetching stones:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredStones = stones.filter(stone => {
        if (filter === 'available') return !stone.is_sold;
        if (filter === 'sold') return stone.is_sold;
        return true;
    });

    const sortedStones = [...filteredStones].sort((a, b) => {
        switch (sortBy) {
            case 'price':
                return (b.user_selected_price || b.ai_suggested_medium || 0) - (a.user_selected_price || a.ai_suggested_medium || 0);
            case 'quality':
                return (b.quality_score || 0) - (a.quality_score || 0);
            default:
                return new Date(b.warehouse_entry_date).getTime() - new Date(a.warehouse_entry_date).getTime();
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Đang tải danh sách viên đá...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-4">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        I. INDIVIDUAL STONE MANAGEMENT
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Quản lý từng viên đá với AI pricing và learning system
                    </p>
                </div>

                {/* Filters and Controls */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Lọc theo trạng thái
                                </label>
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="available">Còn hàng</option>
                                    <option value="sold">Đã bán</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Sắp xếp theo
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="date">Ngày nhập</option>
                                    <option value="price">Giá bán</option>
                                    <option value="quality">Chất lượng</option>
                                </select>
                            </div>
                        </div>

                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Tổng: {sortedStones.length} viên đá
                        </div>
                    </div>
                </div>

                {/* Stones Grid */}
                {sortedStones.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Không tìm thấy viên đá nào phù hợp với bộ lọc.
                        </p>
                        <Link
                            href="/batches/new"
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            + Thêm lô đá mới
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sortedStones.map((stone) => (
                            <Link
                                key={stone.id}
                                href={`/stones/${stone.id}`}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                <div className="aspect-square relative">
                                    <Image
                                        src={stone.image_path}
                                        alt={stone.stone_type}
                                        fill
                                        className="object-cover"
                                    />
                                    {stone.is_sold && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                                            Đã bán
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                                        Chất lượng: {(stone.quality_score * 100).toFixed(0)}%
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                        {stone.stone_type}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        Lô #{stone.batch_id} • ID #{stone.id}
                                    </p>

                                    <div className="space-y-1 text-sm">
                                        {stone.weight && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">Trọng lượng:</span>
                                                <span className="font-medium">{stone.weight}g</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Giá lô:</span>
                                            <span className="font-medium">
                                                {new Intl.NumberFormat('vi-VN').format(stone.import_price)} VNĐ
                                            </span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Giá định mức:</span>
                                            <span className="font-medium text-blue-600 dark:text-blue-400">
                                                {stone.individual_import_price ?
                                                    new Intl.NumberFormat('vi-VN').format(stone.individual_import_price) :
                                                    'Đang tính...'
                                                } VNĐ/viên
                                            </span>
                                        </div>

                                        {stone.user_selected_price ? (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">Giá bán:</span>
                                                <span className="font-bold text-green-600 dark:text-green-400">
                                                    {new Intl.NumberFormat('vi-VN').format(stone.user_selected_price)} VNĐ
                                                </span>
                                            </div>
                                        ) : stone.ai_suggested_medium ? (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">AI đề xuất:</span>
                                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                                    {new Intl.NumberFormat('vi-VN').format(stone.ai_suggested_medium)} VNĐ
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-center py-2">
                                                <span className="text-yellow-600 dark:text-yellow-400 text-xs">
                                                    Chưa định giá
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500 dark:text-gray-400">Nhập kho:</span>
                                            <span>{new Date(stone.warehouse_entry_date).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}