-- preliminary_infoテーブルに不足している全カラムを追加するSQL
-- Supabase SQL Editorで実行してください

-- 振付師関連のカラムを追加
ALTER TABLE preliminary_info 
ADD COLUMN IF NOT EXISTS choreographer1_name TEXT,
ADD COLUMN IF NOT EXISTS choreographer1_furigana TEXT,
ADD COLUMN IF NOT EXISTS choreographer2_name TEXT,
ADD COLUMN IF NOT EXISTS choreographer2_furigana TEXT;

-- 現在のテーブル構造を確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'preliminary_info' 
ORDER BY ordinal_position;

-- IMPORTANT: 実行後の手順
-- 1. 上記のSELECT文の結果を確認して、カラムが追加されたことを確認
-- 2. Supabaseプロジェクトを再起動: Settings → General → Restart project
-- 3. または5分程度待ってキャッシュが更新されるのを待つ