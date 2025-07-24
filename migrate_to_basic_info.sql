-- 1. basic_infoテーブルの作成（既存の場合は修正）
CREATE TABLE IF NOT EXISTS basic_info (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  
  -- 基本情報フィールド
  dance_style TEXT NOT NULL,
  representative_name TEXT NOT NULL,
  representative_furigana TEXT NOT NULL,
  representative_email TEXT NOT NULL,
  partner_name TEXT,
  partner_furigana TEXT,
  phone_number TEXT NOT NULL,
  choreographer TEXT,
  choreographer_furigana TEXT,
  agreement_checked BOOLEAN DEFAULT false,
  privacy_policy_checked BOOLEAN DEFAULT false,
  
  -- 監査フィールド
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- ユニーク制約
  UNIQUE(entry_id)
);

-- 2. RLS（Row Level Security）の有効化
ALTER TABLE basic_info ENABLE ROW LEVEL SECURITY;

-- 3. RLSポリシーの作成
-- 自分のエントリーの基本情報を見れる
CREATE POLICY "Users can view own basic info" ON basic_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = basic_info.entry_id 
      AND entries.user_id = auth.uid()
    )
  );

-- 自分のエントリーの基本情報を作成できる
CREATE POLICY "Users can create own basic info" ON basic_info
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = basic_info.entry_id 
      AND entries.user_id = auth.uid()
    )
  );

-- 自分のエントリーの基本情報を更新できる
CREATE POLICY "Users can update own basic info" ON basic_info
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = basic_info.entry_id 
      AND entries.user_id = auth.uid()
    )
  );

-- 管理者は全ての基本情報を見れる
CREATE POLICY "Admins can view all basic info" ON basic_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 管理者は全ての基本情報を更新できる
CREATE POLICY "Admins can update all basic info" ON basic_info
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 4. 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_basic_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_basic_info_updated_at ON basic_info;
CREATE TRIGGER update_basic_info_updated_at
  BEFORE UPDATE ON basic_info
  FOR EACH ROW
  EXECUTE FUNCTION update_basic_info_updated_at();

-- 5. 作成時に作成者を自動設定するトリガー
CREATE OR REPLACE FUNCTION set_basic_info_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = COALESCE(NEW.created_by, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_basic_info_created_by ON basic_info;
CREATE TRIGGER set_basic_info_created_by
  BEFORE INSERT ON basic_info
  FOR EACH ROW
  EXECUTE FUNCTION set_basic_info_created_by();

-- 6. 既存のentriesテーブルのデータを移行
-- まず、既存のデータをクリーンアップ（必要に応じて）
DELETE FROM basic_info WHERE entry_id IN (SELECT id FROM entries);

-- 既存のentriesテーブルからデータを移行
INSERT INTO basic_info (
  entry_id,
  dance_style,
  representative_name,
  representative_furigana,
  representative_email,
  partner_name,
  partner_furigana,
  phone_number,
  choreographer,
  choreographer_furigana,
  agreement_checked,
  privacy_policy_checked,
  created_by,
  created_at,
  updated_by,
  updated_at
)
SELECT 
  id,
  COALESCE(dance_style, ''),
  COALESCE(representative_name, ''),
  COALESCE(representative_furigana, ''),
  COALESCE(representative_email, ''),
  partner_name,
  partner_furigana,
  COALESCE(phone_number, ''),
  choreographer,
  choreographer_furigana,
  COALESCE(agreement_checked, false),
  COALESCE(privacy_policy_checked, false),
  user_id,
  created_at,
  user_id,
  updated_at
FROM entries
WHERE NOT EXISTS (
  SELECT 1 FROM basic_info WHERE basic_info.entry_id = entries.id
);

-- 7. entriesテーブルから基本情報関連のカラムを削除
-- 注意: これを実行する前に、データの移行が正しく完了したことを確認してください
ALTER TABLE entries 
DROP COLUMN IF EXISTS dance_style,
DROP COLUMN IF EXISTS representative_name,
DROP COLUMN IF EXISTS representative_furigana,
DROP COLUMN IF EXISTS representative_email,
DROP COLUMN IF EXISTS partner_name,
DROP COLUMN IF EXISTS partner_furigana,
DROP COLUMN IF EXISTS phone_number,
DROP COLUMN IF EXISTS choreographer,
DROP COLUMN IF EXISTS choreographer_furigana,
DROP COLUMN IF EXISTS agreement_checked,
DROP COLUMN IF EXISTS privacy_policy_checked;

-- 8. entriesテーブルに監査フィールドを追加（まだない場合）
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 9. entriesテーブルの監査トリガー
CREATE OR REPLACE FUNCTION update_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_entries_updated_at();

CREATE OR REPLACE FUNCTION set_entries_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = COALESCE(NEW.created_by, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_entries_created_by ON entries;
CREATE TRIGGER set_entries_created_by
  BEFORE INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION set_entries_created_by();

-- 10. 既存のentriesレコードの監査フィールドを設定
UPDATE entries 
SET created_by = user_id 
WHERE created_by IS NULL;

UPDATE entries 
SET updated_by = user_id 
WHERE updated_by IS NULL;