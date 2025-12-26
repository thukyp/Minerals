import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Trợ lý AI Định giá Khoáng vật
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Hệ thống quản lý và định giá khoáng vật thông minh với AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link 
            href="/batches/new"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thêm lô đá mới</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Nhập thông tin lô hàng mới và tải lên hình ảnh
              </p>
            </div>
          </Link>

          <Link 
            href="/search"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tra cứu bằng ảnh</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Tìm kiếm sản phẩm trong kho bằng hình ảnh và nhận giá đề xuất
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
