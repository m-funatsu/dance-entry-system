# データベース設計

## テーブル構成

### 1. users（ユーザー）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('participant', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. entries（エントリー）
```sql
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dance_style TEXT NOT NULL,
  team_name TEXT,
  participant_names TEXT NOT NULL,
  phone_number TEXT,
  emergency_contact TEXT,
  google_form_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'selected', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. entry_files（エントリーファイル）
```sql
CREATE TABLE entry_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('music', 'audio', 'photo', 'video')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. selections（選考結果）
```sql
CREATE TABLE selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. settings（システム設定）
```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## インデックス設定

```sql
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_status ON entries(status);
CREATE INDEX idx_entry_files_entry_id ON entry_files(entry_id);
CREATE INDEX idx_selections_entry_id ON selections(entry_id);
CREATE INDEX idx_selections_admin_id ON selections(admin_id);
CREATE INDEX idx_settings_key ON settings(key);
```

## RLS（行レベルセキュリティ）ポリシー

```sql
-- users テーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- entries テーブル
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view own entries" ON entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Participants can update own entries" ON entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all entries" ON entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- entry_files テーブル
ALTER TABLE entry_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own entry files" ON entry_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM entries WHERE id = entry_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage own entry files" ON entry_files FOR ALL USING (
  EXISTS (SELECT 1 FROM entries WHERE id = entry_id AND user_id = auth.uid())
);

-- selections テーブル
ALTER TABLE selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage selections" ON selections FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

## 初期データ

```sql
-- システム設定初期データ
INSERT INTO settings (key, value, description) VALUES
('upload_deadline', '2025-08-31T23:59:59Z', 'アップロード期限'),
('max_file_size_mb', '100', '最大ファイルサイズ（MB）'),
('allowed_video_formats', 'mp4,mov,avi', '許可する動画形式'),
('allowed_audio_formats', 'mp3,wav,aac', '許可する音声形式'),
('allowed_image_formats', 'jpg,jpeg,png', '許可する画像形式');
```