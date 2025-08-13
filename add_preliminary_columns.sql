-- preliminary_infoテーブルに不足しているカラムを追加するSQL
-- Supabase SQL Editorで実行してください

-- 振付師1と振付師2のフリガナフィールドを追加
ALTER TABLE preliminary_info 
ADD COLUMN IF NOT EXISTS choreographer1_furigana TEXT,
ADD COLUMN IF NOT EXISTS choreographer2_furigana TEXT;

-- カラム追加後、テーブル構造を確認
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'preliminary_info' 
-- ORDER BY ordinal_position;

-- 現在のデータを確認（デバッグ用）
-- SELECT * FROM preliminary_info LIMIT 5;