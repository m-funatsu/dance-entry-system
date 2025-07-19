-- セクション期限管理テーブル
CREATE TABLE IF NOT EXISTS section_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_name TEXT NOT NULL UNIQUE,
  deadline TIMESTAMP WITH TIME ZONE,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- セクション名のENUM
-- basic_info: 基本情報
-- music_info: 楽曲情報  
-- additional_info: 追加情報
-- optional_request: 任意申請

-- デフォルトセクションを挿入
INSERT INTO section_deadlines (section_name, deadline, is_required) VALUES
  ('basic_info', NULL, true),
  ('music_info', NULL, true),
  ('additional_info', NULL, true),
  ('optional_request', NULL, false)
ON CONFLICT (section_name) DO NOTHING;

-- RLSポリシー
ALTER TABLE section_deadlines ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能
CREATE POLICY "section_deadlines_read_all" ON section_deadlines
  FOR SELECT USING (true);

-- 管理者のみ更新可能
CREATE POLICY "section_deadlines_update_admin" ON section_deadlines
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_section_deadlines_updated_at BEFORE UPDATE ON section_deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();