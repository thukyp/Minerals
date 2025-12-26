'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';

// --- Định nghĩa các kiểu dữ liệu ---
interface SearchResult {
    image_id: number;
    image_path: string;
    batch_id: number;
    stone_type: string;
    import_date: string;
    import_price: string;
    quantity: number;
    notes: string;
    distance: number;
}

interface PricingInfo {
    suggestedPrice: number;
    minPrice: number;
    maxPrice: number;
    reason: string;
}

// --- Component Modal Định giá ---
const PricingModal = ({ item, onClose }: { item: SearchResult; onClose: () => void; }) => {
    const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [realSellingPrice, setRealSellingPrice] = useState('');

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const response = await fetch(`/api/pricing?batchId=${item.batch_id}`);
                if (!response.ok) throw new Error('Không thể lấy giá đề xuất.');
                const data = await response.json();
                setPricingInfo(data);
                setRealSellingPrice(data.suggestedPrice.toString()); // Gợi ý giá bán bằng giá đề xuất
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPricing();
    }, [item.batch_id]);

    const handleSaveSale = async () => {
        if (!pricingInfo) return;
        try {
            const response = await fetch('/api/sales-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch_id: item.batch_id,
                    ai_suggested_price: pricingInfo.suggestedPrice,
                    real_selling_price: parseFloat(realSellingPrice),
                    selling_date: new Date().toISOString().split('T')[0], // Lấy ngày hiện tại
                }),
            });
            if (!response.ok) throw new Error('Lưu lịch sử thất bại.');
            alert('Đã ghi nhận giao dịch thành công!');
            onClose();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-gray-900 dark:text-white">
                <h2 className="text-2xl font-bold mb-4">Định giá & Ghi nhận</h2>
                <div className="flex items-center space-x-4 mb-6">
                    <Image src={item.image_path} alt={item.stone_type} width={96} height={96} className="w-24 h-24 object-cover rounded-md"/>
                    <div>
                        <h3 className="font-bold text-xl">{item.stone_type}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Lô #{item.batch_id}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Giá nhập: {new Intl.NumberFormat('vi-VN').format(Number(item.import_price))} VNĐ</p>
                    </div>
                </div>

                {isLoading && <p>Đang lấy giá đề xuất...</p>}
                {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
                
                {pricingInfo && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Giá đề xuất</p>
                            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{new Intl.NumberFormat('vi-VN').format(pricingInfo.suggestedPrice)} VNĐ</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Khoảng an toàn: {new Intl.NumberFormat('vi-VN').format(pricingInfo.minPrice)} – {new Intl.NumberFormat('vi-VN').format(pricingInfo.maxPrice)} VNĐ</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                             <p className="text-xs font-semibold">Lý do:</p>
                             <p className="text-xs text-gray-600 dark:text-gray-300">{pricingInfo.reason}</p>
                        </div>
                        <div>
                            <label htmlFor="real_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Giá bán thực tế (VNĐ)</label>
                            <input
                                id="real_price"
                                type="number"
                                value={realSellingPrice}
                                onChange={(e) => setRealSellingPrice(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-4 mt-8">
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">Hủy</button>
                    <button onClick={handleSaveSale} disabled={!realSellingPrice} className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600">Lưu Giao Dịch</button>
                </div>
            </div>
        </div>
    );
};

// --- Component Chính của Trang Tra cứu ---
export default function SearchPage() {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setResults([]); // Xóa kết quả cũ
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            handleSearch(file);
        }
    };

    const handleSearch = async (imageFile: File) => {
        if (!imageFile) {
            setError('Vui lòng chọn một ảnh để tra cứu.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                body: imageFile,
                headers: {
                    'Content-Type': imageFile.type,
                }
            });

            if (!response.ok) {
                throw new Error('Tra cứu thất bại. Vui lòng thử lại.');
            }

            const data: SearchResult[] = await response.json();
            setResults(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="max-w-6xl mx-auto p-8 bg-white dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white">
             {selectedItem && <PricingModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

            <h1 className="text-3xl font-bold mb-6 text-center">Tra cứu khoáng vật bằng hình ảnh</h1>
            
            <div className="flex flex-col items-center mb-8">
                <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center hover:border-indigo-500 transition-colors">
                    <label htmlFor="image-upload" className="cursor-pointer">
                        <p className="text-gray-500 dark:text-gray-400">Nhấn để chọn hoặc kéo thả ảnh vào đây</p>
                        <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                </div>

                {previewUrl && (
                    <div className="mt-6 text-center">
                        <h2 className="text-xl font-semibold mb-2">Ảnh tra cứu:</h2>
                        <Image src={previewUrl} alt="Preview" width={192} height={192} className="w-48 h-48 object-cover rounded-lg shadow-md inline-block" unoptimized />
                    </div>
                )}
            </div>

            {isLoading && <p className="text-center text-blue-500 dark:text-blue-400">Đang tìm kiếm, quá trình này có thể mất một lúc...</p>}
            {error && <p className="text-center text-red-500 dark:text-red-400">{error}</p>}

            {results.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Kết quả tìm kiếm:</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {results.map((item) => (
                            <div 
                                key={item.image_id} 
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transform hover:scale-105 transition-transform"
                                onClick={() => setSelectedItem(item)}
                            >
                                <Image src={item.image_path} alt={item.stone_type} width={400} height={192} className="w-full h-48 object-cover"/>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg">{item.stone_type}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Lô #{item.batch_id}</p>
                                    <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Độ tương đồng:</p>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                            <div 
                                                className="bg-green-500 h-2.5 rounded-full" 
                                                style={{ width: `${Math.max(0, (1 - item.distance) * 100)}%` }}>
                                            </div>
                                        </div>
                                        <p className="text-right text-xs text-gray-500 dark:text-gray-400">{((1 - item.distance) * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

