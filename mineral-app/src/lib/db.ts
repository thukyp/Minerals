import pg from 'pg';

const { Pool } = pg;

// Khởi tạo một connection pool
// Connection string sẽ được đọc từ biến môi trường POSTGRES_URL
// Vercel sẽ tự động cung cấp biến này khi kết nối với Vercel Postgres
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL?.includes('vercel-storage.com') ? {
    rejectUnauthorized: false, // Cần thiết cho các kết nối đến Vercel Postgres
  } : undefined,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

