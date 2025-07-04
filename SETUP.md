# ダンス・エントリー・システム セットアップ手順

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスし、アカウントを作成
2. 新しいプロジェクトを作成
3. データベースのパスワードを設定
4. プロジェクトの作成完了まで待機

## 2. 環境変数の設定

1. `.env.local`ファイルを編集し、以下の値を設定：
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. SupabaseのSettings > API から取得できる値：
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key

## 3. データベースの設定

1. Supabase Dashboard > SQL Editorで以下を実行：

### テーブル作成
```sql
-- users テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('participant', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- entries テーブル
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

-- entry_files テーブル
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

-- selections テーブル
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

-- settings テーブル
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### インデックス作成
```sql
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_status ON entries(status);
CREATE INDEX idx_entry_files_entry_id ON entry_files(entry_id);
CREATE INDEX idx_selections_entry_id ON selections(entry_id);
CREATE INDEX idx_selections_admin_id ON selections(admin_id);
CREATE INDEX idx_settings_key ON settings(key);
```

### RLS（行レベルセキュリティ）設定
```sql
-- users テーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- entries テーブル
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view own entries" ON entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Participants can insert own entries" ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Participants can update own entries" ON entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all entries" ON entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all entries" ON entries FOR UPDATE USING (
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

### データベーストリガー（自動プロフィール作成）
```sql
-- 新規ユーザー登録時に自動でプロフィールを作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', 'participant');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 初期データ挿入
```sql
INSERT INTO settings (key, value, description) VALUES
('upload_deadline', '2025-08-31T23:59:59Z', 'アップロード期限'),
('max_file_size_mb', '100', '最大ファイルサイズ（MB）'),
('allowed_video_formats', 'mp4,mov,avi', '許可する動画形式'),
('allowed_audio_formats', 'mp3,wav,aac', '許可する音声形式'),
('allowed_image_formats', 'jpg,jpeg,png', '許可する画像形式');
```

## 4. ストレージの設定

1. Supabase Dashboard > Storage でバケットを作成：
   - `entry-files` バケット（音源・写真・動画用）

2. ストレージポリシーを設定：
```sql
-- entry-files バケット用ポリシー
CREATE POLICY "Users can upload own files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'entry-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT USING (
  bucket_id = 'entry-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (
  bucket_id = 'entry-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 5. 開発環境の起動

```bash
npm install
npm run dev
```

## 6. 管理者アカウントの作成

初回セットアップ時に管理者アカウントを作成するため、以下のSQLを実行：

```sql
-- 管理者ユーザーの作成（適切なUUIDに置き換え）
INSERT INTO users (id, email, name, role) VALUES 
('your-admin-user-uuid', 'admin@example.com', '管理者', 'admin');
```

## 7. 本番環境へのデプロイ

### Vercelでのデプロイ
1. GitHub リポジトリをVercelに接続
2. 環境変数を設定
3. デプロイ実行

### 環境変数（本番環境）
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```