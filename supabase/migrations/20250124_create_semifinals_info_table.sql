-- 準決勝情報テーブルの作成
CREATE TABLE IF NOT EXISTS semifinals_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  
  -- 楽曲情報
  music_change_from_preliminary BOOLEAN DEFAULT false,
  work_title TEXT,
  work_character_story TEXT,
  copyright_permission BOOLEAN DEFAULT false,
  music_title TEXT,
  cd_title TEXT,
  artist TEXT,
  record_number TEXT,
  jasrac_code TEXT,
  music_type TEXT,
  music_data_path TEXT,
  music_usage_method TEXT,
  
  -- 音響指示情報
  sound_start_timing TEXT,
  chaser_song_designation TEXT,
  chaser_song TEXT,
  fade_out_start_time TEXT,
  fade_out_complete_time TEXT,
  
  -- 照明指示情報
  dance_start_timing TEXT,
  
  -- シーン1
  scene1_time TEXT,
  scene1_trigger TEXT,
  scene1_color_type TEXT,
  scene1_color_other TEXT,
  scene1_image TEXT,
  scene1_image_path TEXT,
  scene1_notes TEXT,
  
  -- シーン2
  scene2_time TEXT,
  scene2_trigger TEXT,
  scene2_color_type TEXT,
  scene2_color_other TEXT,
  scene2_image TEXT,
  scene2_image_path TEXT,
  scene2_notes TEXT,
  
  -- シーン3
  scene3_time TEXT,
  scene3_trigger TEXT,
  scene3_color_type TEXT,
  scene3_color_other TEXT,
  scene3_image TEXT,
  scene3_image_path TEXT,
  scene3_notes TEXT,
  
  -- シーン4
  scene4_time TEXT,
  scene4_trigger TEXT,
  scene4_color_type TEXT,
  scene4_color_other TEXT,
  scene4_image TEXT,
  scene4_image_path TEXT,
  scene4_notes TEXT,
  
  -- シーン5
  scene5_time TEXT,
  scene5_trigger TEXT,
  scene5_color_type TEXT,
  scene5_color_other TEXT,
  scene5_image TEXT,
  scene5_image_path TEXT,
  scene5_notes TEXT,
  
  -- チェイサー/退場
  chaser_exit_time TEXT,
  chaser_exit_trigger TEXT,
  chaser_exit_color_type TEXT,
  chaser_exit_color_other TEXT,
  chaser_exit_image TEXT,
  chaser_exit_image_path TEXT,
  chaser_exit_notes TEXT,
  
  -- 振付情報
  choreographer_change_from_preliminary BOOLEAN DEFAULT false,
  choreographer_name TEXT,
  choreographer_name_kana TEXT,
  
  -- 賞金振込先情報
  bank_name TEXT,
  branch_name TEXT,
  account_type TEXT,
  account_number TEXT,
  account_holder TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id),
  
  UNIQUE(entry_id)
);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_semifinals_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_semifinals_info_updated_at
  BEFORE UPDATE ON semifinals_info
  FOR EACH ROW
  EXECUTE FUNCTION update_semifinals_info_updated_at();

-- 作成時のユーザーIDを自動設定するトリガー
CREATE OR REPLACE FUNCTION set_semifinals_info_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_semifinals_info_created_by
  BEFORE INSERT ON semifinals_info
  FOR EACH ROW
  EXECUTE FUNCTION set_semifinals_info_created_by();

-- RLSポリシー
ALTER TABLE semifinals_info ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のエントリーの準決勝情報を読み書きできる
CREATE POLICY "Users can manage their own semifinals info" ON semifinals_info
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM entries WHERE id = semifinals_info.entry_id
    )
  );

-- 管理者は全ての準決勝情報を読み書きできる
CREATE POLICY "Admins can manage all semifinals info" ON semifinals_info
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );