'use client';

import { useState, FormEvent, useRef, ChangeEvent, DragEvent, useEffect, useCallback } from 'react';

// Icons (assuming Lucide React is installed, if not, we can use emojis or install it)
const UploadIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LoaderIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
}

interface StoneAnalysis {
  imageIndex: number;
  quality: number;
  confidence: number;
  features: string[];
  suggestedPrice: number;
  imageUrl: string;
}

interface PriceSuggestion {
  stones: StoneAnalysis[];
  summary: {
    totalSuggestedPrice: number;
    avgPricePerStone: number;
    minPricePerStone: number;
    maxPricePerStone: number;
    totalStones: number;
  };
  reason: string;
  batchId?: number;
}

interface FormData {
  stoneType: string;
  quantity: string;
  importPrice: string;
  weight: string; // Thêm weight
  dimensions: string; // Thêm dimensions
}

interface FormErrors {
  stoneType?: string;
  quantity?: string;
  importPrice?: string;
  weight?: string; // Thêm weight
  dimensions?: string; // Thêm dimensions
  images?: string;
}

export default function PriceSuggestionPage() {
  const [formData, setFormData] = useState<FormData>({
    stoneType: '',
    quantity: '',
    importPrice: '',
    weight: '', // Thêm weight
    dimensions: '', // Thêm dimensions
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [stoneTypeSuggestions, setStoneTypeSuggestions] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showRealPriceForm, setShowRealPriceForm] = useState(false);
  const [realPrices, setRealPrices] = useState<{ [key: number]: string }>({});
  const [allSold, setAllSold] = useState(false);
  const [sellingDate, setSellingDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingRealPrices, setSavingRealPrices] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const inputFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStoneTypes();
  }, []);

  const fetchStoneTypes = async () => {
    try {
      const res = await fetch('/api/stone-types');
      const data = await res.json();
      setStoneTypeSuggestions(data);
    } catch (err) {
      console.error('Failed to fetch stone types:', err);
    }
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.stoneType.trim()) {
      newErrors.stoneType = 'Vui lòng chọn loại đá';
    }

    const quantity = parseInt(formData.quantity);
    if (!formData.quantity || quantity <= 0) {
      newErrors.quantity = 'Số lượng phải lớn hơn 0';
    }

    const importPrice = parseFloat(formData.importPrice);
    if (!formData.importPrice || importPrice < 0) {
      newErrors.importPrice = 'Giá nhập phải >= 0';
    }

    const weight = parseFloat(formData.weight);
    if (!formData.weight || weight <= 0) {
      newErrors.weight = 'Trọng lượng phải lớn hơn 0';
    }

    if (!formData.dimensions.trim()) {
      newErrors.dimensions = 'Vui lòng nhập kích thước';
    }

    if (imagePreviews.length === 0) {
      newErrors.images = 'Vui lòng tải lên ít nhất 1 hình ảnh';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, imagePreviews]);

  const handleInputChange = (field: keyof FormData) => (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const generateImageId = () => Math.random().toString(36).substr(2, 9);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const newPreviews: ImagePreview[] = [];
    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} không phải là hình ảnh hợp lệ`);
        return;
      }
      if (file.size > maxSize) {
        setError(`File ${file.name} quá lớn (tối đa 10MB)`);
        return;
      }

      const preview = URL.createObjectURL(file);
      newPreviews.push({ file, preview, id: generateImageId() });
    });

    setImagePreviews((prev) => [...prev, ...newPreviews].slice(0, 10)); // Max 10 images
    setError(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setImagePreviews((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      // Cleanup object URLs
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return updated;
    });
  };

  const resetForm = () => {
    setFormData({ stoneType: '', quantity: '', importPrice: '', weight: '', dimensions: '' });
    setErrors({});
    setError(null);
    setSuggestion(null);
    setImagePreviews([]);
    setUploadProgress(0);
    setShowRealPriceForm(false);
    setRealPrices({});
    setAllSold(false);
    setSellingDate(new Date().toISOString().split('T')[0]);
  };

  const handleRealPriceChange = (imageIndex: number, value: string) => {
    setRealPrices(prev => ({ ...prev, [imageIndex]: value }));
  };

  const handleSaveRealPrices = async (e: FormEvent) => {
    e.preventDefault();

    // Validate that all prices are entered if allSold is true
    if (allSold) {
      const missingPrices = suggestion?.stones.filter(stone => !realPrices[stone.imageIndex]);
      if (missingPrices && missingPrices.length > 0) {
        setError('Vui lòng nhập giá bán thực tế cho tất cả các viên đá');
        return;
      }
    }

    setSavingRealPrices(true);
    setError(null);

    try {
      if (!suggestion) {
        throw new Error('No price suggestion available');
      }

      const batchId = suggestion.batchId;
      if (!batchId) {
        throw new Error('Batch ID not found');
      }

      // Fetch stones for this batch
      const stonesResponse = await fetch(`/api/stones?batch_id=${batchId}`);
      const stones = await stonesResponse.json();

      // Update stones with user selected prices and mark as sold
      const updatePromises = suggestion.stones
        .filter(stone => realPrices[stone.imageIndex])
        .map(stone => {
          const realPrice = parseFloat(realPrices[stone.imageIndex]);
          const stoneRecord = stones[stone.imageIndex]; // assume order matches
          return fetch('/api/stones', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: stoneRecord.id,
              user_selected_price: realPrice,
              is_sold: true
            })
          });
        });

      await Promise.all(updatePromises);

      // Then save sales history for each stone that was sold
      const salesPromises = suggestion.stones
        .filter(stone => realPrices[stone.imageIndex])
        .map(stone => {
          const realPrice = parseFloat(realPrices[stone.imageIndex]);
          const stoneRecord = stones[stone.imageIndex];
          return fetch('/api/sales-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stone_id: stoneRecord.id,
              batch_id: batchId,
              stone_type: formData.stoneType,
              quantity_sold: 1, // Each stone is sold individually
              ai_suggested_price: stone.suggestedPrice,
              real_selling_price: realPrice,
              selling_date: sellingDate,
              quality_score: stone.quality,
              notes: `Quality: ${stone.features.join(', ')}`
            })
          });
        });

      await Promise.all(salesPromises);

      setMessage({ type: 'success', text: 'Đã lưu giá bán thực tế thành công! AI sẽ học hỏi từ dữ liệu này.' });
      setShowRealPriceForm(false);
      setRealPrices({});

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi khi lưu giá bán thực tế');
    } finally {
      setSavingRealPrices(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('stone_type', formData.stoneType);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('import_price', formData.importPrice);
      formDataToSend.append('weight', formData.weight);
      formDataToSend.append('dimensions', formData.dimensions);
      imagePreviews.forEach((preview) => {
        formDataToSend.append('images', preview.file);
      });

      const response = await fetch('/api/price-suggestion', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data: PriceSuggestion = await response.json();
      setSuggestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định');
    } finally {
      setIsLoading(false);
      setUploadProgress(100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            💎 Đề Xuất Giá Bán Khoáng Sản
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sử dụng trí tuệ nhân tạo để phân tích hình ảnh và đề xuất giá bán tối ưu cho khoáng sản của bạn
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <h2 className="text-2xl font-semibold text-white flex items-center">
              <UploadIcon />
              <span className="ml-3">Thông Tin Khoáng Sản</span>
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="space-y-2">
                <label htmlFor="stoneType" className="block text-sm font-semibold text-gray-700">
                  Loại đá <span className="text-red-500">*</span>
                </label>
                <select
                  id="stoneType"
                  value={formData.stoneType}
                  onChange={handleInputChange('stoneType')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.stoneType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Chọn loại đá</option>
                  {stoneTypeSuggestions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.stoneType && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XIcon />
                    <span className="ml-1">{errors.stoneType}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700">
                  Số lượng (viên) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange('quantity')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.quantity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nhập số lượng"
                  min="1"
                  required
                />
                {errors.quantity && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XIcon />
                    <span className="ml-1">{errors.quantity}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="importPrice" className="block text-sm font-semibold text-gray-700">
                  Giá nhập (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="importPrice"
                  value={formData.importPrice}
                  onChange={handleInputChange('importPrice')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.importPrice ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nhập giá nhập"
                  min="0"
                  step="1000"
                  required
                />
                {errors.importPrice && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XIcon />
                    <span className="ml-1">{errors.importPrice}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="weight" className="block text-sm font-semibold text-gray-700">
                  Trọng lượng (gram) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="weight"
                  value={formData.weight}
                  onChange={handleInputChange('weight')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.weight ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nhập trọng lượng"
                  min="0.1"
                  step="0.1"
                  required
                />
                {errors.weight && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XIcon />
                    <span className="ml-1">{errors.weight}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="dimensions" className="block text-sm font-semibold text-gray-700">
                  Kích thước <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange('dimensions')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.dimensions ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="vd: 5x3x2 cm"
                  required
                />
                {errors.dimensions && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XIcon />
                    <span className="ml-1">{errors.dimensions}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Hình ảnh khoáng sản <span className="text-red-500">*</span>
                <span className="text-gray-500 font-normal ml-2">
                  ({imagePreviews.length}/10 ảnh đã tải lên)
                </span>
              </label>

              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50 scale-105'
                    : 'border-gray-300 hover:border-gray-400'
                } ${errors.images ? 'border-red-300 bg-red-50' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <UploadIcon />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Kéo thả hình ảnh vào đây
                    </p>
                    <p className="text-gray-500">hoặc</p>
                    <button
                      type="button"
                      onClick={() => inputFileRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      chọn từ máy tính
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">
                    PNG, JPG, GIF, WebP • Tối đa 10MB mỗi ảnh • Tối đa 10 ảnh
                  </p>
                </div>
                <input
                  ref={inputFileRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {errors.images && (
                <p className="text-sm text-red-600 flex items-center">
                  <XIcon />
                  <span className="ml-1">{errors.images}</span>
                </p>
              )}

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {imagePreviews.map((preview) => (
                    <div key={preview.id} className="relative group">
                      <img
                        src={preview.preview}
                        alt="Preview"
                        className="w-full h-24 object-cover rounded-lg shadow-md transition-transform group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(preview.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <XIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center">
                <XIcon />
                <span className="ml-3">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className={`px-6 py-4 rounded-lg flex items-center ${
                message.type === 'success'
                  ? 'bg-blue-50 border border-blue-200 text-blue-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message.type === 'success' ? <CheckIcon /> : <XIcon />}
                <span className="ml-3">{message.text}</span>
                <button
                  onClick={() => setMessage(null)}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  <XIcon />
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <LoaderIcon />
                    <span>Đang phân tích...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    <span>Đề Xuất Giá</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Làm mới
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {suggestion && (
          <div className="mt-8 space-y-6">
            {/* AI Learning Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                🤖 AI Đã Học Từ Dữ Liệu
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl mb-2">📊</div>
                  <p className="text-sm text-gray-600">Dựa trên dữ liệu bán hàng thực tế</p>
                  <p className="text-lg font-medium text-blue-600 mt-1">Đề xuất giá được tối ưu hóa</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl mb-2">📈</div>
                  <p className="text-sm text-gray-600">Áp dụng xu hướng thị trường</p>
                  <p className="text-lg font-medium text-blue-600 mt-1">Giá tự động điều chỉnh</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl mb-2">🔍</div>
                  <p className="text-sm text-gray-600">Phân tích chất lượng từng viên</p>
                  <p className="text-lg font-medium text-blue-600 mt-1">Đề xuất giá cá nhân hóa</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-6 flex items-center">
                💰 Tóm Tắt Đề Xuất Giá
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Tổng giá đề xuất</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {suggestion.summary.totalSuggestedPrice.toLocaleString()} VNĐ
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Giá trung bình/viên</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {suggestion.summary.avgPricePerStone.toLocaleString()} VNĐ
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Giá thấp nhất</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {suggestion.summary.minPricePerStone.toLocaleString()} VNĐ
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Giá cao nhất</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {suggestion.summary.maxPricePerStone.toLocaleString()} VNĐ
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-gray-700 leading-relaxed">{suggestion.reason}</p>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-purple-800 mb-6 flex items-center">
                🔬 Phân Tích Chi Tiết ({suggestion.stones.length} viên)
              </h3>

              {/* Nút lưu giá bán thực tế */}
              <div className="mb-6 p-4 bg-white rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">💰 Lưu Giá Bán Thực Tế</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Sau khi bán được, hãy nhập giá bán thực tế để AI học hỏi và đề xuất chính xác hơn trong tương lai.
                </p>
                <button
                  onClick={() => setShowRealPriceForm(!showRealPriceForm)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {showRealPriceForm ? 'Ẩn Form' : 'Nhập Giá Bán Thực Tế'}
                </button>
              </div>

              {/* Form nhập giá bán thực tế */}
              {showRealPriceForm && (
                <div className="mb-6 p-4 bg-white rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-4">Nhập Giá Bán Thực Tế</h4>
                  <form onSubmit={handleSaveRealPrices} className="space-y-4">
                    {suggestion.stones.map((stone, index) => (
                      <div key={stone.imageIndex} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={imagePreviews[stone.imageIndex]?.preview || stone.imageUrl}
                          alt={`Viên ${index + 1}`}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <span className="font-medium">Viên {index + 1}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            (Đề xuất: {stone.suggestedPrice.toLocaleString()} VNĐ)
                          </span>
                        </div>
                        <input
                          type="number"
                          value={realPrices[stone.imageIndex] || ''}
                          onChange={(e) => handleRealPriceChange(stone.imageIndex, e.target.value)}
                          placeholder="Giá bán thực tế"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          min="0"
                          step="1000"
                        />
                        <span className="text-sm text-gray-600">VNĐ</span>
                      </div>
                    ))}

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={allSold}
                          onChange={(e) => setAllSold(e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">Đã bán hết</span>
                      </label>

                      <input
                        type="date"
                        value={sellingDate}
                        onChange={(e) => setSellingDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingRealPrices}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                    >
                      {savingRealPrices ? (
                        <>
                          <LoaderIcon />
                          <span className="ml-2">Đang lưu...</span>
                        </>
                      ) : (
                        'Lưu Giá Bán Thực Tế'
                      )}
                    </button>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestion.stones.map((stone, index) => (
                  <div key={stone.imageIndex} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="flex items-start space-x-4 mb-4">
                      <img
                        src={imagePreviews[stone.imageIndex]?.preview || stone.imageUrl}
                        alt={`Viên đá ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg shadow-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Viên {index + 1}</h4>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            stone.quality > 0.8 ? 'bg-blue-500' :
                            stone.quality > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-600">
                            Chất lượng: {Math.round(stone.quality * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Đánh giá:</span>
                        <span className="text-sm font-medium text-blue-600 text-right">
                          {stone.features.join(', ')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Giá đề xuất:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {stone.suggestedPrice.toLocaleString()} VNĐ
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Độ tin cậy:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${stone.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {Math.round(stone.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}