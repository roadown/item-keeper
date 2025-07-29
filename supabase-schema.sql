-- 创建智能物品管家数据库表

-- 启用RLS（行级安全性）
ALTER DATABASE postgres SET "app.jwt_secret" TO 'super-secret-jwt-token-with-at-least-32-characters-long';

-- 物品记录表
CREATE TABLE IF NOT EXISTS item_records (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    item TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    raw_input TEXT NOT NULL,
    source TEXT DEFAULT 'text',
    tags TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 回收站表
CREATE TABLE IF NOT EXISTS recycle_bin (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    item TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    raw_input TEXT NOT NULL,
    source TEXT DEFAULT 'text',
    tags TEXT[] DEFAULT '{}',
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    delete_reason TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用行级安全性
ALTER TABLE item_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycle_bin ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
-- 物品记录表的策略
CREATE POLICY "Users can only see their own records" ON item_records
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records" ON item_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records" ON item_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own records" ON item_records  
    FOR DELETE USING (auth.uid() = user_id);

-- 回收站表的策略
CREATE POLICY "Users can only see their own recycle bin items" ON recycle_bin
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recycle bin items" ON recycle_bin
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recycle bin items" ON recycle_bin
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recycle bin items" ON recycle_bin
    FOR DELETE USING (auth.uid() = user_id);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_item_records_user_id ON item_records(user_id);
CREATE INDEX IF NOT EXISTS idx_item_records_created_at ON item_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_records_item ON item_records(item);
CREATE INDEX IF NOT EXISTS idx_item_records_location ON item_records(location);

CREATE INDEX IF NOT EXISTS idx_recycle_bin_user_id ON recycle_bin(user_id);
CREATE INDEX IF NOT EXISTS idx_recycle_bin_deleted_at ON recycle_bin(deleted_at DESC);

-- 创建全文搜索索引（如果需要更高级的搜索功能）
CREATE INDEX IF NOT EXISTS idx_item_records_search ON item_records 
USING gin(to_tsvector('chinese', item || ' ' || location || ' ' || raw_input));

CREATE INDEX IF NOT EXISTS idx_recycle_bin_search ON recycle_bin 
USING gin(to_tsvector('chinese', item || ' ' || location || ' ' || raw_input));

-- 创建触发器函数来自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为两个表创建触发器
CREATE TRIGGER update_item_records_updated_at BEFORE UPDATE ON item_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recycle_bin_updated_at BEFORE UPDATE ON recycle_bin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();