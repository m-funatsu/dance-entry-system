-- 予選情報テーブルの作成
CREATE TABLE IF NOT EXISTS preliminary_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  work_title TEXT NOT NULL,
  work_story TEXT,
  video_submitted BOOLEAN DEFAULT false,
  music_rights_cleared BOOLEAN DEFAULT false,
  music_title TEXT NOT NULL,
  cd_title TEXT,
  artist TEXT NOT NULL,
  record_number TEXT,
  jasrac_code TEXT,
  music_type TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_preliminary_info_entry_id ON preliminary_info(entry_id);

-- RLSの有効化
ALTER TABLE preliminary_info ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- 参加者は自分のエントリーの予選情報のみ閲覧・編集可能
CREATE POLICY "Users can view own preliminary info" ON preliminary_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = preliminary_info.entry_id
      AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own preliminary info" ON preliminary_info
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = preliminary_info.entry_id
      AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own preliminary info" ON preliminary_info
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = preliminary_info.entry_id
      AND entries.user_id = auth.uid()
    )
  );

-- 管理者は全ての予選情報を閲覧可能
CREATE POLICY "Admins can view all preliminary info" ON preliminary_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 監査用トリガー関数
CREATE OR REPLACE FUNCTION update_preliminary_info_audit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新時のトリガー
CREATE TRIGGER update_preliminary_info_audit_trigger
  BEFORE UPDATE ON preliminary_info
  FOR EACH ROW
  EXECUTE FUNCTION update_preliminary_info_audit();

-- 作成時のトリガー
CREATE OR REPLACE FUNCTION set_preliminary_info_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_preliminary_info_created_by_trigger
  BEFORE INSERT ON preliminary_info
  FOR EACH ROW
  EXECUTE FUNCTION set_preliminary_info_created_by();

-- 既存のentriesテーブルから関連カラムを削除
-- (必要に応じて実行)
-- ALTER TABLE entries
-- DROP COLUMN IF EXISTS music_title,
-- DROP COLUMN IF EXISTS original_artist,
-- DROP COLUMN IF EXISTS story,
-- DROP COLUMN IF EXISTS work_title;

-- 期限設定の追加（既に存在する場合は更新）
INSERT INTO settings (key, value, description)
VALUES ('preliminary_deadline', '', '予選情報の提出期限')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;