-- =================================================
-- Missing Tables Migration for Dance Entry System
-- =================================================
-- このSQLをSupabase管理画面のSQL Editorで実行してください

-- 1. 準決勝情報テーブル作成
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

-- 2. 決勝情報テーブル作成
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

-- 3. 申請情報テーブル作成
CREATE TABLE IF NOT EXISTS public.applications_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
  related_ticket_count INTEGER,
  related1_relationship TEXT,
  related1_name TEXT,
  related1_furigana TEXT,
  related2_relationship TEXT,
  related2_name TEXT,
  related2_furigana TEXT,
  related3_relationship TEXT,
  related3_name TEXT,
  related3_furigana TEXT,
  related4_relationship TEXT,
  related4_name TEXT,
  related4_furigana TEXT,
  related5_relationship TEXT,
  related5_name TEXT,
  related5_furigana TEXT,
  related_ticket_total_amount INTEGER,
  companion1_name TEXT,
  companion1_furigana TEXT,
  companion1_purpose TEXT,
  companion2_name TEXT,
  companion2_furigana TEXT,
  companion2_purpose TEXT,
  companion3_name TEXT,
  companion3_furigana TEXT,
  companion3_purpose TEXT,
  companion_total_amount INTEGER,
  payment_slip_path TEXT,
  applications_notes TEXT,
  makeup_preferred_stylist TEXT,
  makeup_name TEXT,
  makeup_email TEXT,
  makeup_phone TEXT,
  makeup_notes TEXT,
  makeup_style1 TEXT,
  makeup_style2 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  UNIQUE(entry_id)
);

-- 4. SNS情報テーブル作成
CREATE TABLE IF NOT EXISTS public.sns_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
  practice_video_path TEXT,
  practice_video_filename TEXT,
  introduction_highlight TEXT,
  sns_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  UNIQUE(entry_id)
);

-- =================================================
-- Row Level Security (RLS) 設定
-- =================================================

-- RLS有効化
ALTER TABLE public.semifinals_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finals_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sns_info ENABLE ROW LEVEL SECURITY;

-- =================================================
-- RLSポリシー作成（全テーブル共通パターン）
-- =================================================

-- semifinals_info のポリシー
CREATE POLICY "Users can view their own semifinals_info" ON public.semifinals_info
  FOR SELECT USING (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own semifinals_info" ON public.semifinals_info
  FOR INSERT WITH CHECK (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own semifinals_info" ON public.semifinals_info
  FOR UPDATE USING (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all semifinals_info" ON public.semifinals_info
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- finals_info のポリシー
CREATE POLICY "Users can view their own finals_info" ON public.finals_info
  FOR SELECT USING (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own finals_info" ON public.finals_info
  FOR INSERT WITH CHECK (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own finals_info" ON public.finals_info
  FOR UPDATE USING (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all finals_info" ON public.finals_info
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- applications_info のポリシー
CREATE POLICY "Users can view their own applications_info" ON public.applications_info
  FOR SELECT USING (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own applications_info" ON public.applications_info
  FOR INSERT WITH CHECK (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own applications_info" ON public.applications_info
  FOR UPDATE USING (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all applications_info" ON public.applications_info
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- sns_info のポリシー
CREATE POLICY "Users can view their own sns_info" ON public.sns_info
  FOR SELECT USING (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own sns_info" ON public.sns_info
  FOR INSERT WITH CHECK (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own sns_info" ON public.sns_info
  FOR UPDATE USING (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all sns_info" ON public.sns_info
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- =================================================
-- インデックス作成（パフォーマンス向上）
-- =================================================

CREATE INDEX IF NOT EXISTS idx_semifinals_info_entry_id ON public.semifinals_info(entry_id);
CREATE INDEX IF NOT EXISTS idx_finals_info_entry_id ON public.finals_info(entry_id);
CREATE INDEX IF NOT EXISTS idx_applications_info_entry_id ON public.applications_info(entry_id);
CREATE INDEX IF NOT EXISTS idx_sns_info_entry_id ON public.sns_info(entry_id);

-- =================================================
-- トリガー作成（updated_at自動更新）
-- =================================================

-- updated_at更新関数（既に存在する場合はスキップ）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガー設定
CREATE TRIGGER update_semifinals_info_updated_at 
  BEFORE UPDATE ON public.semifinals_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finals_info_updated_at 
  BEFORE UPDATE ON public.finals_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_info_updated_at 
  BEFORE UPDATE ON public.applications_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sns_info_updated_at 
  BEFORE UPDATE ON public.sns_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================
-- 実行完了メッセージ
-- =================================================

SELECT 'Migration completed: All missing tables have been created successfully!' as status;