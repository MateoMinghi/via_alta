-- Create users table to store local authentication data
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  ivd_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_ivd_id ON users(ivd_id);