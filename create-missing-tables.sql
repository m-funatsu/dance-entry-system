-- 準決勝情報テーブル作成
CREATE TABLE IF NOT EXISTS public.semifinals_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
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
  sound_start_timing TEXT,
  chaser_song_designation TEXT,
  chaser_song TEXT,
  fade_out_start_time TEXT,
  fade_out_complete_time TEXT,
  dance_start_timing TEXT,
  scene1_time TEXT,
  scene1_trigger TEXT,
  scene1_color_type TEXT,
  scene1_color_other TEXT,
  scene1_image TEXT,
  scene1_image_path TEXT,
  scene1_notes TEXT,
  scene2_time TEXT,
  scene2_trigger TEXT,
  scene2_color_type TEXT,
  scene2_color_other TEXT,
  scene2_image TEXT,
  scene2_image_path TEXT,
  scene2_notes TEXT,
  scene3_time TEXT,
  scene3_trigger TEXT,
  scene3_color_type TEXT,
  scene3_color_other TEXT,
  scene3_image TEXT,
  scene3_image_path TEXT,
  scene3_notes TEXT,
  scene4_time TEXT,
  scene4_trigger TEXT,
  scene4_color_type TEXT,
  scene4_color_other TEXT,
  scene4_image TEXT,
  scene4_image_path TEXT,
  scene4_notes TEXT,
  scene5_time TEXT,
  scene5_trigger TEXT,
  scene5_color_type TEXT,
  scene5_color_other TEXT,
  scene5_image TEXT,
  scene5_image_path TEXT,
  scene5_notes TEXT,
  chaser_exit_time TEXT,
  chaser_exit_trigger TEXT,
  chaser_exit_color_type TEXT,
  chaser_exit_color_other TEXT,
  chaser_exit_image TEXT,
  chaser_exit_image_path TEXT,
  chaser_exit_notes TEXT,
  choreographer_change_from_preliminary BOOLEAN DEFAULT false,
  choreographer_name TEXT,
  choreographer_name_kana TEXT,
  bank_name TEXT,
  branch_name TEXT,
  account_type TEXT,
  account_number TEXT,
  account_holder TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  UNIQUE(entry_id)
);

-- 決勝情報テーブル作成
CREATE TABLE IF NOT EXISTS public.finals_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
  music_change BOOLEAN DEFAULT false,
  copy_preliminary_music BOOLEAN DEFAULT false,
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
  sound_change_from_semifinals BOOLEAN DEFAULT false,
  sound_start_timing TEXT,
  chaser_song_designation TEXT,
  chaser_song TEXT,
  fade_out_start_time TEXT,
  fade_out_complete_time TEXT,
  lighting_change_from_semifinals BOOLEAN DEFAULT false,
  dance_start_timing TEXT,
  scene1_time TEXT,
  scene1_trigger TEXT,
  scene1_color_type TEXT,
  scene1_color_other TEXT,
  scene1_image TEXT,
  scene1_image_path TEXT,
  scene1_notes TEXT,
  scene2_time TEXT,
  scene2_trigger TEXT,
  scene2_color_type TEXT,
  scene2_color_other TEXT,
  scene2_image TEXT,
  scene2_image_path TEXT,
  scene2_notes TEXT,
  scene3_time TEXT,
  scene3_trigger TEXT,
  scene3_color_type TEXT,
  scene3_color_other TEXT,
  scene3_image TEXT,
  scene3_image_path TEXT,
  scene3_notes TEXT,
  scene4_time TEXT,
  scene4_trigger TEXT,
  scene4_color_type TEXT,
  scene4_color_other TEXT,
  scene4_image TEXT,
  scene4_image_path TEXT,
  scene4_notes TEXT,
  scene5_time TEXT,
  scene5_trigger TEXT,
  scene5_color_type TEXT,
  scene5_color_other TEXT,
  scene5_image TEXT,
  scene5_image_path TEXT,
  scene5_notes TEXT,
  chaser_exit_time TEXT,
  chaser_exit_trigger TEXT,
  chaser_exit_color_type TEXT,
  chaser_exit_color_other TEXT,
  chaser_exit_image TEXT,
  chaser_exit_image_path TEXT,
  chaser_exit_notes TEXT,
  choreographer_change BOOLEAN DEFAULT false,
  choreographer_name TEXT,
  choreographer_name_kana TEXT,
  choreographer2_name TEXT,
  choreographer2_name_kana TEXT,
  choreographer_attendance BOOLEAN DEFAULT false,
  choreographer_photo_permission BOOLEAN DEFAULT false,
  choreographer_photo_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  UNIQUE(entry_id)
);

-- RLS（Row Level Security）ポリシーを設定
ALTER TABLE public.semifinals_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finals_info ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーが自分のエントリーに関連するデータのみアクセス可能
CREATE POLICY "Users can view their own semifinals_info" ON public.semifinals_info
  FOR SELECT USING (
    entry_id IN (
      SELECT id FROM public.entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own semifinals_info" ON public.semifinals_info
  FOR INSERT WITH CHECK (
    entry_id IN (
      SELECT id FROM public.entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own semifinals_info" ON public.semifinals_info
  FOR UPDATE USING (
    entry_id IN (
      SELECT id FROM public.entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own finals_info" ON public.finals_info
  FOR SELECT USING (
    entry_id IN (
      SELECT id FROM public.entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own finals_info" ON public.finals_info
  FOR INSERT WITH CHECK (
    entry_id IN (
      SELECT id FROM public.entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own finals_info" ON public.finals_info
  FOR UPDATE USING (
    entry_id IN (
      SELECT id FROM public.entries WHERE user_id = auth.uid()
    )
  );

-- 管理者は全てのデータにアクセス可能
CREATE POLICY "Admins can view all semifinals_info" ON public.semifinals_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all finals_info" ON public.finals_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_semifinals_info_entry_id ON public.semifinals_info(entry_id);
CREATE INDEX IF NOT EXISTS idx_finals_info_entry_id ON public.finals_info(entry_id);

-- トリガー作成（updated_at自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_semifinals_info_updated_at BEFORE UPDATE ON public.semifinals_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finals_info_updated_at BEFORE UPDATE ON public.finals_info  
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();