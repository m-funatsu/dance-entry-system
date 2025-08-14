-- finals_infoテーブルの現在の構造を確認するSQL
-- Supabase SQL Editorで実行してください

-- テーブル構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'finals_info' 
ORDER BY ordinal_position;

-- 既存のデータを確認（最初の5件）
SELECT * FROM finals_info LIMIT 5;

-- 送信データに含まれるカラムの存在確認
SELECT 
    'choreographer_furigana' as column_to_check,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finals_info' 
        AND column_name = 'choreographer_furigana'
    ) as exists
UNION ALL
SELECT 
    'choreographer2_furigana',
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finals_info' 
        AND column_name = 'choreographer2_furigana'
    )
UNION ALL
SELECT 
    'choreography_change_timing',
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finals_info' 
        AND column_name = 'choreography_change_timing'
    )
UNION ALL
SELECT 
    'choreography_before_change',
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finals_info' 
        AND column_name = 'choreography_before_change'
    )
UNION ALL
SELECT 
    'choreography_after_change',
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finals_info' 
        AND column_name = 'choreography_after_change'
    )
UNION ALL
SELECT 
    'props_usage',
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finals_info' 
        AND column_name = 'props_usage'
    )
UNION ALL
SELECT 
    'props_details',
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finals_info' 
        AND column_name = 'props_details'
    );