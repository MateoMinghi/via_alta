-- Create coordinator_degrees table to store which degrees a coordinator manages
CREATE TABLE IF NOT EXISTS coordinator_degrees (
  id SERIAL PRIMARY KEY,
  coordinator_id TEXT NOT NULL,
  degree_id INTEGER NOT NULL,
  degree_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coordinator_id) REFERENCES users(ivd_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coordinator_degrees_coordinator_id ON coordinator_degrees(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_coordinator_degrees_degree_id ON coordinator_degrees(degree_id);