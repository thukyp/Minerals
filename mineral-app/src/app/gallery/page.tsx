'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface MineralImage {
  id: number;
  image_path: string;
  created_at: string;
  stone_type: string;
  batch_id: number;
}

const Loader = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

export default function GalleryPage() {
  const [images, setImages] = useState<MineralImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/gallery');
        if (!response.ok) {
          throw new Error('Failed to fetch images from the server.');
        }
        const data = await response.json();
        setImages(data.images || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Thư Viện Hình Ảnh Khoáng Sản
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Xem tất cả các hình ảnh khoáng sản đã được tải lên hệ thống.
        </p>
      </div>

      {isLoading && <Loader />}

      {error && (
        <div className="text-center text-red-500 bg-red-100 border border-red-400 rounded-lg p-4">
          <p className="font-bold">Đã xảy ra lỗi</p>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && images.length === 0 && (
        <div className="text-center text-gray-500">
          <p className="text-xl">Chưa có hình ảnh nào được tải lên.</p>
        </div>
      )}

      {!isLoading && !error && images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {images.map((image) => (
            <div key={image.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 group transform hover:scale-105 transition-transform duration-300">
              <div className="relative w-full h-56">
                <Image
                  src={image.image_path}
                  alt={`Mineral ${image.id}`}
                  layout="fill"
                  objectFit="cover"
                  className="transition-opacity duration-300 group-hover:opacity-90"
                />
                 <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-opacity"></div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 truncate" title={image.stone_type}>
                  {image.stone_type}
                </h3>
                <p className="text-sm text-gray-500">Lô #{image.batch_id}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Ngày tải lên: {new Date(image.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
