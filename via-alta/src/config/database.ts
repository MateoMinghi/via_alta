import * as dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// For Heroku, use connection string if available, otherwise use individual params
const connectionString = process.env.DATABASE_URL;

const pool = new Pool(connectionString ? {
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
} : {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT) || 5433,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on("connect", () => {
  console.log("Database connection established");
});

export default pool;
