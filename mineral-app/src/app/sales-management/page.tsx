'use client';

import { useState, useEffect, FormEvent } from 'react';

interface Batch {
  id: number;
  stone_type: string;
  import_date: string;
  import_price: number;
  quantity: number;
}

interface SalesStat {
  stone_type: string;
  total_sales: number;
  avg_accuracy: number;
  avg_selling_price: number;
  min_price: number;
  max_price: number;
  avg_quality: number;
  last_sale_date: string;
}

export default function SalesManagementPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [salesStats, setSalesStats] = useState<SalesStat[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [quantitySold, setQuantitySold] = useState('');
  const [realSellingPrice, setRealSellingPrice] = useState('');
  const [qualityScore, setQualityScore] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Lấy danh sách batches chưa bán hết
      const batchesRes = await fetch('/api/batches');
      if (!batchesRes.ok) {
        console.error('Failed to fetch batches:', batchesRes.status);
        setBatches([]);
      } else {
        const batchesData = await batchesRes.json();
        setBatches(Array.isArray(batchesData) ? batchesData.filter((b: Batch) => b.quantity > 0) : []);
      }

      // Lấy thống kê bán hàng
      const statsRes = await fetch('/api/sales-history');
      if (!statsRes.ok) {
        console.error('Failed to fetch sales stats:', statsRes.status);
        setSalesStats([]);
      } else {
        const statsData = await statsRes.json();
        setSalesStats(Array.isArray(statsData.sales_stats) ? statsData.sales_stats : []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setBatches([]);
      setSalesStats([]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const batch = batches.find(b => b.id.toString() === selectedBatch);
      if (!batch) return;

      const response = await fetch('/api/sales-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: parseInt(selectedBatch),
          stone_type: batch.stone_type,
          quantity_sold: parseInt(quantitySold),
          ai_suggested_price: 0, // sẽ cập nhật sau
          real_selling_price: parseFloat(realSellingPrice),
          quality_score: qualityScore ? parseFloat(qualityScore) : null,
          notes
        })
      });

      if (response.ok) {
        setMessage('Đã lưu thông tin bán hàng thành công!');
        // Reset form
        setSelectedBatch('');
        setQuantitySold('');
        setRealSellingPrice('');
        setQualityScore('');
        setNotes('');
        // Reload data
        loadData();
      } else {
        setMessage('Có lỗi xảy ra khi lưu dữ liệu');
      }
    } catch (error) {
      setMessage('Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Quản Lý Bán Hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form nhập dữ liệu bán hàng */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-xl shadow-lg border border-blue-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nhập Thông Tin Bán Hàng
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chọn Lô Đá
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Chọn lô đá</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    {batch.stone_type} - {batch.quantity} viên - {batch.import_price.toLocaleString()} VNĐ
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số Lượng Bán
              </label>
              <input
                type="number"
                value={quantitySold}
                onChange={(e) => setQuantitySold(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá Bán Thực Tế (VNĐ)
              </label>
              <input
                type="number"
                value={realSellingPrice}
                onChange={(e) => setRealSellingPrice(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="0"
                step="1000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Điểm Chất Lượng (0-1, tùy chọn)
              </label>
              <input
                type="number"
                value={qualityScore}
                onChange={(e) => setQualityScore(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="0"
                max="1"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi Chú
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Đang lưu...' : 'Lưu Thông Tin Bán Hàng'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-md ${message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
        </div>

        {/* Thống kê bán hàng */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-xl shadow-lg border border-green-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Thống Kê Bán Hàng (90 ngày)
          </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {salesStats.map(stat => (
                <div key={stat.stone_type} className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{stat.stone_type}</h3>
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {stat.total_sales} giao dịch
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Giá TB</p>
                      <p className="text-lg font-bold text-green-600">
                        {stat.avg_selling_price ? stat.avg_selling_price.toLocaleString() : 'N/A'} VNĐ
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Độ chính xác AI</p>
                      <p className="text-lg font-bold text-blue-600">
                        {stat.avg_accuracy ? (stat.avg_accuracy * 100).toFixed(1) : 'N/A'}%
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Giá thấp nhất</p>
                      <p className="text-sm font-semibold text-red-600">
                        {stat.min_price ? stat.min_price.toLocaleString() : 'N/A'} VNĐ
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Giá cao nhất</p>
                      <p className="text-sm font-semibold text-green-600">
                        {stat.max_price ? stat.max_price.toLocaleString() : 'N/A'} VNĐ
                      </p>
                    </div>
                  </div>

                  {stat.avg_quality && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Chất lượng trung bình:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-yellow-400 to-green-500 h-2 rounded-full"
                              style={{ width: `${stat.avg_quality * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{(stat.avg_quality * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}