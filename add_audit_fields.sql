-- entriesテーブルに監査フィールドを追加
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 既存のトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;

-- 新しいトリガーを作成
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_entries_updated_at();

-- 作成時に作成者を自動設定するトリガー
CREATE OR REPLACE FUNCTION set_entries_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = COALESCE(NEW.created_by, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 既存のトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS set_entries_created_by ON entries;

-- 新しいトリガーを作成
CREATE TRIGGER set_entries_created_by
  BEFORE INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION set_entries_created_by();

-- 既存のレコードのcreated_byを設定（user_idから）
UPDATE entries 
SET created_by = user_id 
WHERE created_by IS NULL;

-- basic_infoテーブルが誤って作成された場合は削除
DROP TABLE IF EXISTS basic_info CASCADE;