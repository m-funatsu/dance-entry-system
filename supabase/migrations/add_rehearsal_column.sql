-- ======================================
-- リハーサル参加カラム追加用SQL
-- 準決勝テーブルにリハーサル参加確認項目を追加
-- ======================================

-- 準決勝テーブル (semifinals_info) へのカラム追加
ALTER TABLE semifinals_info
ADD COLUMN IF NOT EXISTS rehearsal_participation VARCHAR(50);

-- カラムコメントを追加
COMMENT ON COLUMN semifinals_info.rehearsal_participation IS 'リハーサルへの参加（希望する/希望しない）';

-- 既存データを更新して、デフォルト値を設定しない（必須項目なのでNULLのまま）
-- 新規登録時にユーザーが選択する必要がある

-- インデックスを追加（検索性能向上のため）
CREATE INDEX IF NOT EXISTS idx_semifinals_info_rehearsal ON semifinals_info(rehearsal_participation);