-- エントリーとダンススタイルの確認用SQL
-- Supabase SQL Editorで実行してください

-- 1. entriesテーブルのdance_styleフィールドを確認
SELECT 
    id,
    user_id,
    dance_style,
    participant_names,
    created_at
FROM entries
ORDER BY created_at DESC
LIMIT 10;

-- 2. basic_infoテーブルのdance_styleフィールドを確認
SELECT 
    id,
    entry_id,
    dance_style,
    category_division,
    representative_name,
    created_at
FROM basic_info
ORDER BY created_at DESC
LIMIT 10;

-- 3. エントリーとbasic_infoをJOINして確認
SELECT 
    e.id as entry_id,
    e.dance_style as entries_dance_style,
    e.participant_names,
    bi.id as basic_info_id,
    bi.dance_style as basic_info_dance_style,
    bi.category_division
FROM entries e
LEFT JOIN basic_info bi ON bi.entry_id = e.id
ORDER BY e.created_at DESC
LIMIT 10;

-- 4. dance_styleが空またはNULLのエントリーを確認
SELECT 
    'entries' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN dance_style IS NULL THEN 1 END) as null_count,
    COUNT(CASE WHEN dance_style = '' THEN 1 END) as empty_count
FROM entries
UNION ALL
SELECT 
    'basic_info' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN dance_style IS NULL THEN 1 END) as null_count,
    COUNT(CASE WHEN dance_style = '' THEN 1 END) as empty_count
FROM basic_info;

-- 5. 最新のbasic_infoエントリーの全フィールドを確認
SELECT * 
FROM basic_info 
ORDER BY created_at DESC 
LIMIT 1;