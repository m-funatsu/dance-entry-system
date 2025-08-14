-- preliminary_infoテーブルの現在の構造を確認するSQL
-- Supabase SQL Editorで実行してください

-- テーブル構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'preliminary_info' 
ORDER BY ordinal_position;

-- 既存のデータを確認（最初の5件）
SELECT * FROM preliminary_info LIMIT 5;