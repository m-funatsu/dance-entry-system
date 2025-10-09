-- ======================================
-- リハーサル参加カラムのロールバック用SQL
-- 追加したリハーサル参加確認項目を削除する場合に使用
-- ======================================

-- インデックスを削除
DROP INDEX IF EXISTS idx_semifinals_info_rehearsal;

-- 準決勝テーブル (semifinals_info) からカラムを削除
ALTER TABLE semifinals_info
DROP COLUMN IF EXISTS rehearsal_participation;