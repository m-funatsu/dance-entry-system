-- preliminary_infoテーブルにwork_title_kanaカラムを追加するSQL
-- Supabase SQL Editorで実行してください

-- work_title_kanaカラムを追加
ALTER TABLE preliminary_info 
ADD COLUMN IF NOT EXISTS work_title_kana TEXT;

-- 現在のテーブル構造を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'preliminary_info' 
ORDER BY ordinal_position;

-- IMPORTANT: 実行後の手順
-- 1. 上記のSELECT文の結果を確認して、カラムが追加されたことを確認
-- 2. Supabaseプロジェクトを再起動: Settings → General → Restart project
-- 3. または5分程度待ってキャッシュが更新されるのを待つ