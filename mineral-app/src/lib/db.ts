import pg from 'pg';
import pgvector from 'pgvector/pg';

const { Pool } = pg;

// Đăng ký kiểu dữ liệu vector (sử dụng lazy initialization)
let poolInitialized = false;

function initializePool() {
  if (!poolInitialized) {
    pgvector.registerType(Pool);
    poolInitialized = true;
  }
}

// Khởi tạo một connection pool
// Connection string sẽ được đọc từ biến môi trường POSTGRES_URL
// Vercel sẽ tự động cung cấp biến này khi kết nối với Vercel Postgres
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL?.includes('localhost') ? undefined : {
    rejectUnauthorized: false, // Cần thiết cho các kết nối đến Vercel Postgres
  },
});

// Khởi tạo pgvector khi module được load
initializePool();

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

