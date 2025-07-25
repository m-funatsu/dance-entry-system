-- 各種申請情報テーブルの作成
CREATE TABLE IF NOT EXISTS applications_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  
  -- 関係者チケット注文申請
  related_ticket_count INTEGER DEFAULT 0,
  
  -- 関係者1
  related1_relationship TEXT,
  related1_name TEXT,
  related1_furigana TEXT,
  
  -- 関係者2
  related2_relationship TEXT,
  related2_name TEXT,
  related2_furigana TEXT,
  
  -- 関係者3
  related3_relationship TEXT,
  related3_name TEXT,
  related3_furigana TEXT,
  
  -- 関係者4
  related4_relationship TEXT,
  related4_name TEXT,
  related4_furigana TEXT,
  
  -- 関係者5
  related5_relationship TEXT,
  related5_name TEXT,
  related5_furigana TEXT,
  
  -- 関係者チケット合計金額
  related_ticket_total_amount INTEGER DEFAULT 0,
  
  -- 選手同伴申請
  -- 同伴者1
  companion1_name TEXT,
  companion1_furigana TEXT,
  companion1_purpose TEXT,
  
  -- 同伴者2
  companion2_name TEXT,
  companion2_furigana TEXT,
  companion2_purpose TEXT,
  
  -- 同伴者3
  companion3_name TEXT,
  companion3_furigana TEXT,
  companion3_purpose TEXT,
  
  -- 選手同伴申請合計金額
  companion_total_amount INTEGER DEFAULT 0,
  
  -- 払込用紙
  payment_slip_path TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id),
  
  UNIQUE(entry_id)
);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_applications_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_info_updated_at
  BEFORE UPDATE ON applications_info
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_info_updated_at();

-- 作成時のユーザーIDを自動設定するトリガー
CREATE OR REPLACE FUNCTION set_applications_info_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_applications_info_created_by
  BEFORE INSERT ON applications_info
  FOR EACH ROW
  EXECUTE FUNCTION set_applications_info_created_by();

-- RLSポリシー
ALTER TABLE applications_info ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のエントリーの各種申請情報を読み書きできる
CREATE POLICY "Users can manage their own applications info" ON applications_info
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM entries WHERE id = applications_info.entry_id
    )
  );

-- 管理者は全ての各種申請情報を読み書きできる
CREATE POLICY "Admins can manage all applications info" ON applications_info
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );