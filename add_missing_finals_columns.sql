-- finals_infoテーブルに不足しているカラムを追加するSQL
-- Supabase SQL Editorで実行してください

-- 現在のテーブル構造を確認（実行前）
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'finals_info' 
ORDER BY ordinal_position;

-- 不足しているカラムを追加
ALTER TABLE finals_info 
-- 振付師関連
ADD COLUMN IF NOT EXISTS choreographer_furigana TEXT,
ADD COLUMN IF NOT EXISTS choreographer2_furigana TEXT,
-- 振付変更詳細（既に作成済みの場合はスキップされる）
ADD COLUMN IF NOT EXISTS choreography_change_timing TEXT,
ADD COLUMN IF NOT EXISTS choreography_before_change TEXT,
ADD COLUMN IF NOT EXISTS choreography_after_change TEXT,
-- 小道具関連
ADD COLUMN IF NOT EXISTS props_usage TEXT,
ADD COLUMN IF NOT EXISTS props_details TEXT;

-- 古いカラム名が存在する場合は削除（オプション）
-- これらのカラムが存在しない場合はエラーになるので、必要に応じてコメントアウトしてください
-- ALTER TABLE finals_info 
-- DROP COLUMN IF EXISTS choreographer_name_kana,
-- DROP COLUMN IF EXISTS choreographer2_name_kana;

-- カラムが追加されたことを確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'finals_info' 
AND column_name IN (
  'choreographer_furigana',
  'choreographer2_furigana',
  'choreography_change_timing',
  'choreography_before_change',
  'choreography_after_change',
  'props_usage',
  'props_details'
)
ORDER BY ordinal_position;

-- IMPORTANT: 実行後の手順
-- 1. 上記のSELECT文の結果を確認して、カラムが追加されたことを確認
-- 2. Supabaseプロジェクトを再起動: Settings → General → Restart project
-- 3. または5分程度待ってキャッシュが更新されるのを待つ