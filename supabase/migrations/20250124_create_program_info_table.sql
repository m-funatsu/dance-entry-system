-- プログラム掲載用情報テーブルの作成
CREATE TABLE IF NOT EXISTS program_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  
  -- 基本情報
  song_count TEXT NOT NULL CHECK (song_count IN ('1曲', '2曲')),
  player_photo_type TEXT,
  affiliation TEXT,
  player_photo_path TEXT,
  notes TEXT,
  
  -- 準決勝用情報
  semifinal_story TEXT,
  semifinal_highlight TEXT,
  semifinal_image1_path TEXT,
  semifinal_image2_path TEXT,
  semifinal_image3_path TEXT,
  semifinal_image4_path TEXT,
  
  -- 決勝用情報（楽曲数が2曲の場合のみ使用）
  final_affiliation TEXT,
  final_player_photo_path TEXT,
  final_story TEXT,
  final_highlight TEXT,
  final_image1_path TEXT,
  final_image2_path TEXT,
  final_image3_path TEXT,
  final_image4_path TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(entry_id)
);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_program_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_program_info_updated_at
  BEFORE UPDATE ON program_info
  FOR EACH ROW
  EXECUTE FUNCTION update_program_info_updated_at();

-- RLSポリシー
ALTER TABLE program_info ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のエントリーのプログラム情報を読み書きできる
CREATE POLICY "Users can manage their own program info" ON program_info
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM entries WHERE id = program_info.entry_id
    )
  );

-- 管理者は全てのプログラム情報を読み書きできる
CREATE POLICY "Admins can manage all program info" ON program_info
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );