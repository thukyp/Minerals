'use client';

import { useState, FormEvent, useRef, ChangeEvent, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ImagePreview {
  file: File;
  preview: string;
}

export default function NewBatchPage() {
  const [stoneType, setStoneType] = useState('');
  const [importDate, setImportDate] = useState('');
  const [importPrice, setImportPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const inputFileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newPreviews: ImagePreview[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newPreviews.push({ file, preview });
      }
    });
    
    setImagePreviews((prev) => [...prev, ...newPreviews]);
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

  const removeImage = (index: number) => {
    const preview = imagePreviews[index].preview;
    URL.revokeObjectURL(preview);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (imagePreviews.length === 0) {
      setError('Vui lòng chọn ít nhất một ảnh.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadStatus('');

    try {
      // --- Bước 1: Tạo lô hàng để lấy batch_id ---
      setUploadStatus('Đang tạo lô hàng...');
      const batchResponse = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stone_type: stoneType,
          import_date: importDate,
          import_price: parseFloat(importPrice),
          quantity: parseInt(quantity, 10),
          notes: notes,
        }),
      });

      if (!batchResponse.ok) {
        throw new Error('Không thể tạo lô hàng. Vui lòng thử lại.');
      }
      
      const newBatch = await batchResponse.json();
      const batchId = newBatch.id;

      // --- Bước 2: Upload các ảnh đã chọn ---
      for (let i = 0; i < imagePreviews.length; i++) {
        const { file } = imagePreviews[i];
        setUploadStatus(`Đang tải lên ảnh ${i + 1}/${imagePreviews.length}...`);
        
        try {
          // Upload file lên Vercel Blob
          const uploadResponse = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
            method: 'POST',
            body: file,
            headers: {
              // Không set Content-Type để browser tự động set với boundary cho multipart
            },
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(
              `Tải lên ảnh ${file.name} thất bại: ${errorData.message || errorData.error || 'Unknown error'}`
            );
          }
          
          const newBlob = await uploadResponse.json();
          
          if (!newBlob.url) {
            throw new Error(`Không nhận được URL từ server cho ảnh ${file.name}`);
          }
          
          // Lưu đường dẫn ảnh vào CSDL
          const imageResponse = await fetch('/api/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              batch_id: batchId,
              image_path: newBlob.url,
            })
          });

          if (!imageResponse.ok) {
            const errorData = await imageResponse.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(
              `Lưu thông tin ảnh ${file.name} thất bại: ${errorData.message || errorData.error || 'Unknown error'}`
            );
          }
        } catch (uploadError) {
          // Nếu lỗi upload, dừng lại và báo lỗi
          throw uploadError;
        }
      }

      // Dọn dẹp preview URLs
      imagePreviews.forEach(({ preview }) => URL.revokeObjectURL(preview));
      
      setUploadStatus('Hoàn thành!');
      alert('Thêm lô hàng và hình ảnh thành công!');
      router.push('/'); 

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Thêm lô đá mới</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="stone_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên loại đá
          </label>
          <input
            id="stone_type"
            type="text"
            value={stoneType}
            onChange={(e) => setStoneType(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="import_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ngày nhập
            </label>
            <input
              id="import_date"
              type="date"
              value={importDate}
              onChange={(e) => setImportDate(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Số lượng
            </label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div>
            <label htmlFor="import_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Giá nhập (VNĐ)
            </label>
            <input
              id="import_price"
              type="number"
              value={importPrice}
              onChange={(e) => setImportPrice(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
            />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ghi chú
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
          />
        </div>

        <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hình ảnh lô hàng {imagePreviews.length > 0 && `(${imagePreviews.length} ảnh)`}
            </label>
            
            {/* Khu vực kéo thả */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <input
                id="images"
                type="file"
                multiple
                accept="image/*"
                ref={inputFileRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kéo thả ảnh vào đây hoặc{' '}
                  <button
                    type="button"
                    onClick={() => inputFileRef.current?.click()}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium underline"
                  >
                    chọn từ máy tính
                  </button>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Hỗ trợ nhiều ảnh cùng lúc (JPG, PNG, WEBP)
                </p>
              </div>
            </div>

            {/* Grid hiển thị preview ảnh */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                      <Image
                        src={preview.preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Xóa ảnh"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                      {preview.file.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {(preview.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ))}
              </div>
            )}
        </div>

        {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
        {uploadStatus && <p className="text-blue-500 dark:text-blue-400 text-sm">{uploadStatus}</p>}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600"
          >
            {isLoading ? 'Đang lưu...' : 'Lưu lô hàng'}
          </button>
        </div>
      </form>
    </div>
  );
}

