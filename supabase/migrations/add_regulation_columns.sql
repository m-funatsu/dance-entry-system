-- ======================================
-- レギュレーションカラム追加用SQL
-- 準決勝と決勝のテーブルにレギュレーション確認項目を追加
-- ======================================

-- 準決勝テーブル (semifinals_info) へのカラム追加
ALTER TABLE semifinals_info
ADD COLUMN IF NOT EXISTS lift_regulation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS no_props BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS performance_time BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS no_antisocial BOOLEAN DEFAULT FALSE;

-- カラムコメントを追加（準決勝）
COMMENT ON COLUMN semifinals_info.lift_regulation IS 'リフト規定の確認（1回のリフトは15秒以下かつ3回以下）';
COMMENT ON COLUMN semifinals_info.no_props IS '小道具使用禁止の確認';
COMMENT ON COLUMN semifinals_info.performance_time IS '演技時間の確認（4分以内）';
COMMENT ON COLUMN semifinals_info.no_antisocial IS '反社会的内容禁止の確認';

-- 決勝テーブル (finals_info) へのカラム追加
ALTER TABLE finals_info
ADD COLUMN IF NOT EXISTS lift_regulation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS no_props BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS performance_time BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS no_antisocial BOOLEAN DEFAULT FALSE;

-- カラムコメントを追加（決勝）
COMMENT ON COLUMN finals_info.lift_regulation IS 'リフト規定の確認（1回のリフトは15秒以下かつ3回以下）';
COMMENT ON COLUMN finals_info.no_props IS '小道具使用禁止の確認';
COMMENT ON COLUMN finals_info.performance_time IS '演技時間の確認（4分以内）';
COMMENT ON COLUMN finals_info.no_antisocial IS '反社会的内容禁止の確認';

-- 既存データを更新して、デフォルト値をFALSEに設定（念のため）
UPDATE semifinals_info
SET
    lift_regulation = COALESCE(lift_regulation, FALSE),
    no_props = COALESCE(no_props, FALSE),
    performance_time = COALESCE(performance_time, FALSE),
    no_antisocial = COALESCE(no_antisocial, FALSE)
WHERE lift_regulation IS NULL
   OR no_props IS NULL
   OR performance_time IS NULL
   OR no_antisocial IS NULL;

UPDATE finals_info
SET
    lift_regulation = COALESCE(lift_regulation, FALSE),
    no_props = COALESCE(no_props, FALSE),
    performance_time = COALESCE(performance_time, FALSE),
    no_antisocial = COALESCE(no_antisocial, FALSE)
WHERE lift_regulation IS NULL
   OR no_props IS NULL
   OR performance_time IS NULL
   OR no_antisocial IS NULL;

-- インデックスを追加（検索性能向上のため）
CREATE INDEX IF NOT EXISTS idx_semifinals_info_regulation ON semifinals_info(lift_regulation, no_props, performance_time, no_antisocial);
CREATE INDEX IF NOT EXISTS idx_finals_info_regulation ON finals_info(lift_regulation, no_props, performance_time, no_antisocial);