-- preliminary_infoテーブルに不足しているカラムを追加するSQL
-- Supabase SQL Editorで実行してください

-- 振付師1と振付師2のフリガナフィールドを追加
ALTER TABLE preliminary_info 
ADD COLUMN IF NOT EXISTS choreographer1_furigana TEXT,
ADD COLUMN IF NOT EXISTS choreographer2_furigana TEXT;

-- IMPORTANT: Supabaseのスキーマキャッシュをリフレッシュする
-- カラムを追加した後、以下のいずれかを実行してください：
-- 1. Supabaseダッシュボードで「Database」→「Tables」→「preliminary_info」を開いて確認
-- 2. または、プロジェクトを一度再起動（Settings → General → Restart project）
-- 3. または、数分待ってキャッシュが自動更新されるのを待つ

-- カラム追加後、テーブル構造を確認
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'preliminary_info' 
-- ORDER BY ordinal_position;

-- 現在のデータを確認（デバッグ用）
-- SELECT * FROM preliminary_info LIMIT 5;