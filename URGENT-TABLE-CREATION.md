# 緊急：不足テーブル作成ガイド

## 問題の状況
準決勝情報と決勝情報のフォームで **404エラー** が発生しています。
調査の結果、以下の2つのテーブルが **データベースに存在しない** ことが判明しました：

- `semifinals_info` (準決勝情報)
- `finals_info` (決勝情報)

## 解決方法

### ステップ1: Supabase管理画面にアクセス
1. https://supabase.com にログイン
2. プロジェクト「dance-entry-system」を選択
3. 左メニューから **SQL Editor** をクリック

### ステップ2: 以下のSQLを実行

```sql
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

-- RLS（Row Level Security）有効化
ALTER TABLE public.semifinals_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finals_info ENABLE ROW LEVEL SECURITY;

-- ユーザーが自分のエントリーのみアクセス可能なポリシー
CREATE POLICY "Users can manage their own semifinals_info" ON public.semifinals_info
  FOR ALL USING (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage their own finals_info" ON public.finals_info
  FOR ALL USING (
    entry_id IN (SELECT id FROM public.entries WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_semifinals_info_entry_id ON public.semifinals_info(entry_id);
CREATE INDEX IF NOT EXISTS idx_finals_info_entry_id ON public.finals_info(entry_id);

-- 成功メッセージ
SELECT 'テーブル作成完了: semifinals_info と finals_info が正常に作成されました！' as result;
```

### ステップ3: 実行確認
SQL Editorで上記のSQLを実行し、最後に「テーブル作成完了」メッセージが表示されれば成功です。

### ステップ4: アプリケーションで確認
1. ブラウザで `http://localhost:3002/dashboard/semifinals` にアクセス
2. ブラウザで `http://localhost:3002/dashboard/finals` にアクセス  
3. 404エラーが解消され、フォームが正常に表示されることを確認

## 実行後の効果
- ✅ 準決勝情報フォームの404エラーが解消
- ✅ 決勝情報フォームの404エラーが解消
- ✅ ユーザーが自分のエントリー情報のみアクセス可能
- ✅ つの管理者は全てのデータにアクセス可能
- ✅ データの整合性と セキュリティが確保