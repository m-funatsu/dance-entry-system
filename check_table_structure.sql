-- 各テーブルの現在の構造を確認するSQL
-- Supabase SQL Editorで実行してください

-- basic_infoテーブルの構造
SELECT '=== basic_info テーブル ===' as table_info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'basic_info' 
ORDER BY ordinal_position;

-- preliminary_infoテーブルの構造
SELECT '=== preliminary_info テーブル ===' as table_info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'preliminary_info' 
ORDER BY ordinal_position;

-- semifinals_infoテーブルの構造
SELECT '=== semifinals_info テーブル ===' as table_info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'semifinals_info' 
ORDER BY ordinal_position;

-- finals_infoテーブルの構造
SELECT '=== finals_info テーブル ===' as table_info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'finals_info' 
ORDER BY ordinal_position;