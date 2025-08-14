-- finals_infoテーブルに不足しているカラムを追加するSQL
-- Supabase SQL Editorで実行してください

-- 不足しているカラムを追加
ALTER TABLE finals_info 
ADD COLUMN IF NOT EXISTS choreographer_furigana TEXT,
ADD COLUMN IF NOT EXISTS choreographer2_furigana TEXT,
ADD COLUMN IF NOT EXISTS props_usage TEXT,
ADD COLUMN IF NOT EXISTS props_details TEXT;

-- カラムが追加されたことを確認
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'finals_info' 
AND column_name IN (
    'choreographer_furigana',
    'choreographer2_furigana', 
    'props_usage',
    'props_details'
)
ORDER BY column_name;

-- IMPORTANT: 実行後の手順
-- 1. 上記のSELECT文の結果を確認して、4つのカラムすべてが表示されることを確認
-- 2. Supabaseプロジェクトを再起動: Settings → General → Restart project
-- 3. または5分程度待ってキャッシュが更新されるのを待つ