-- Smart Survey Database Schema
-- 用于 Cloudflare D1 数据库

-- 创建 surveys 表（问卷）
CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  title TEXT,
  json TEXT NOT NULL,
  theme_type TEXT DEFAULT 'default',
  owner_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建 results 表（问卷答案）
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_surveys_owner_id ON surveys(owner_id);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_survey_id ON results(survey_id);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at DESC);
