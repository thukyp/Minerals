import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Trợ lý AI Định giá Khoáng vật
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Hệ thống quản lý và định giá khoáng vật thông minh với AI học từ quyết định của bạn
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">

          {/* I. INITIAL DATA INPUT */}
          <Link
            href="/batches/new"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📦</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                I. Nhập dữ liệu ban đầu
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Thêm lô đá mới với thông tin chi tiết và hình ảnh từng viên
              </p>
            </div>
          </Link>

          {/* II. AI PRICE SUGGESTION + III. USER ADJUSTMENT */}
          <Link
            href="/stones"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                II-III. AI Đề xuất & Điều chỉnh
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                AI phân tích và đề xuất giá, bạn quyết định cuối cùng
              </p>
            </div>
          </Link>

          {/* V. MARKET TRENDS */}
          <Link
            href="/market-trends"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                V. Xu hướng thị trường
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Nhập điều kiện thị trường thực tế để AI điều chỉnh giá
              </p>
            </div>
          </Link>

          {/* VII. RE-QUERYING */}
          <Link
            href="/search"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                VII. Tra cứu & Cập nhật giá
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Tìm kiếm bằng ảnh và nhận giá cập nhật theo thời gian
              </p>
            </div>
          </Link>

          {/* SALES MANAGEMENT */}
          <Link
            href="/sales-management"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Quản lý bán hàng
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Ghi nhận giao dịch và theo dõi độ chính xác AI
              </p>
            </div>
          </Link>

          {/* GALLERY */}
          <Link
            href="/gallery"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🖼️</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Thư viện ảnh
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Xem tất cả hình ảnh khoáng vật trong kho
              </p>
            </div>
          </Link>
        </div>

        {/* Core Principles */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            VIII. CORE PRINCIPLES (DO NOT BREAK)
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">AI không bán tự động</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">AI không ghi đè giá người dùng</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">AI học từ quyết định người dùng</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Giá thị trường = tham khảo, không tuyệt đối</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
