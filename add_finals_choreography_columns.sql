-- finals_infoテーブルに振付変更詳細カラムを追加するSQL
-- Supabase SQL Editorで実行してください

-- 振付変更の詳細情報カラムを追加
ALTER TABLE finals_info 
ADD COLUMN IF NOT EXISTS choreography_change_timing TEXT,
ADD COLUMN IF NOT EXISTS choreography_before_change TEXT,
ADD COLUMN IF NOT EXISTS choreography_after_change TEXT;

-- 現在のテーブル構造を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'finals_info' 
AND column_name IN ('choreography_change_timing', 'choreography_before_change', 'choreography_after_change')
ORDER BY ordinal_position;

-- IMPORTANT: 実行後の手順
-- 1. 上記のSELECT文の結果を確認して、カラムが追加されたことを確認
-- 2. Supabaseプロジェクトを再起動: Settings → General → Restart project
-- 3. または5分程度待ってキャッシュが更新されるのを待つ