'use client';

import { useState, useEffect } from 'react';

interface MarketTrend {
  id: number;
  stone_type: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentage_change: number;
  notes: string;
  start_date: string;
  end_date?: string;
  created_at: string;
}

export default function MarketTrendsPage() {
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTrend, setEditingTrend] = useState<MarketTrend | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    stone_type: '',
    trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
    percentage_change: 0,
    notes: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const response = await fetch('/api/market-trends');
      if (response.ok) {
        const data = await response.json();
        setTrends(data);
      }
    } catch (err) {
      console.error('Error fetching trends:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTrend ? `/api/market-trends/${editingTrend.id}` : '/api/market-trends';
      const method = editingTrend ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchTrends();
        resetForm();
        alert(editingTrend ? 'Xu hướng đã được cập nhật!' : 'Xu hướng mới đã được thêm!');
      } else {
        throw new Error('Failed to save trend');
      }
    } catch {
      alert('Có lỗi xảy ra khi lưu xu hướng');
    }
  };

  const resetForm = () => {
    setFormData({
      stone_type: '',
      trend: 'stable',
      percentage_change: 0,
      notes: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    });
    setShowAddForm(false);
    setEditingTrend(null);
  };

  const handleEdit = (trend: MarketTrend) => {
    setFormData({
      stone_type: trend.stone_type,
      trend: trend.trend,
      percentage_change: trend.percentage_change,
      notes: trend.notes,
      start_date: trend.start_date,
      end_date: trend.end_date || ''
    });
    setEditingTrend(trend);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa xu hướng này?')) return;

    try {
      const response = await fetch(`/api/market-trends/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchTrends();
        alert('Xu hướng đã được xóa!');
      }
    } catch {
      alert('Có lỗi xảy ra khi xóa xu hướng');
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600 dark:text-green-400';
      case 'decreasing': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải xu hướng thị trường...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            V. MANUAL MARKET CONDITION INPUT (VERY REALISTIC)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý xu hướng thị trường cho các loại khoáng vật
          </p>
        </div>

        {/* Add New Trend Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            + Thêm xu hướng mới
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingTrend ? 'Chỉnh sửa xu hướng' : 'Thêm xu hướng mới'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loại khoáng vật
                  </label>
                  <input
                    type="text"
                    value={formData.stone_type}
                    onChange={(e) => setFormData({ ...formData, stone_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ví dụ: Thạch anh hồng"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Xu hướng
                  </label>
                  <select
                    value={formData.trend}
                    onChange={(e) => setFormData({ ...formData, trend: e.target.value as 'increasing' | 'decreasing' | 'stable' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="increasing">Tăng (increasing)</option>
                    <option value="decreasing">Giảm (decreasing)</option>
                    <option value="stable">Ổn định (stable)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phần trăm thay đổi (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.percentage_change}
                    onChange={(e) => setFormData({ ...formData, percentage_change: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ví dụ: +5, -3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ngày kết thúc (tùy chọn)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ghi chú (collector trends, scarcity, hype, etc.)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ví dụ: Tăng do nhu cầu collector, khan hiếm nguồn cung..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingTrend ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Trends List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Xu hướng thị trường hiện tại
            </h2>
          </div>

          {trends.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Chưa có xu hướng nào được thêm. Hãy thêm xu hướng đầu tiên!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Loại khoáng vật
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Xu hướng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Thay đổi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ghi chú
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {trends.map((trend) => (
                    <tr key={trend.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {trend.stone_type}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center ${getTrendColor(trend.trend)}`}>
                          <span className="mr-2">{getTrendIcon(trend.trend)}</span>
                          <span className="font-medium">
                            {trend.trend === 'increasing' ? 'Tăng' :
                              trend.trend === 'decreasing' ? 'Giảm' : 'Ổn định'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${getTrendColor(trend.trend)}`}>
                          {trend.percentage_change > 0 ? '+' : ''}{trend.percentage_change}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          Từ: {new Date(trend.start_date).toLocaleDateString('vi-VN')}
                        </div>
                        {trend.end_date && (
                          <div>
                            Đến: {new Date(trend.end_date).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {trend.notes}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(trend)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(trend.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}