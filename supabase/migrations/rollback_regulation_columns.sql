-- ======================================
-- レギュレーションカラムのロールバック用SQL
-- 追加したレギュレーション確認項目を削除する場合に使用
-- ======================================

-- インデックスを削除
DROP INDEX IF EXISTS idx_semifinals_info_regulation;
DROP INDEX IF EXISTS idx_finals_info_regulation;

-- 準決勝テーブル (semifinals_info) からカラムを削除
ALTER TABLE semifinals_info
DROP COLUMN IF EXISTS lift_regulation,
DROP COLUMN IF EXISTS no_props,
DROP COLUMN IF EXISTS performance_time,
DROP COLUMN IF EXISTS no_antisocial;

-- 決勝テーブル (finals_info) からカラムを削除
ALTER TABLE finals_info
DROP COLUMN IF EXISTS lift_regulation,
DROP COLUMN IF EXISTS no_props,
DROP COLUMN IF EXISTS performance_time,
DROP COLUMN IF EXISTS no_antisocial;