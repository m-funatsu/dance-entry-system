-- SNS掲載情報テーブルの作成
CREATE TABLE IF NOT EXISTS sns_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  
  -- SNS掲載情報
  practice_video_path TEXT,
  practice_video_filename TEXT,
  introduction_highlight_path TEXT,
  introduction_highlight_filename TEXT,
  sns_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id),
  
  UNIQUE(entry_id)
);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_sns_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sns_info_updated_at
  BEFORE UPDATE ON sns_info
  FOR EACH ROW
  EXECUTE FUNCTION update_sns_info_updated_at();

-- 作成時のユーザーIDを自動設定するトリガー
CREATE OR REPLACE FUNCTION set_sns_info_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sns_info_created_by
  BEFORE INSERT ON sns_info
  FOR EACH ROW
  EXECUTE FUNCTION set_sns_info_created_by();

-- RLSポリシー
ALTER TABLE sns_info ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のエントリーのSNS情報を読み書きできる
CREATE POLICY "Users can manage their own sns info" ON sns_info
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM entries WHERE id = sns_info.entry_id
    )
  );

-- 管理者は全てのSNS情報を読み書きできる
CREATE POLICY "Admins can manage all sns info" ON sns_info
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );