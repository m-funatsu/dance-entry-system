-- 新しいフィールドを追加
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS representative_name TEXT,
ADD COLUMN IF NOT EXISTS representative_furigana TEXT,
ADD COLUMN IF NOT EXISTS partner_name TEXT,
ADD COLUMN IF NOT EXISTS partner_furigana TEXT,
ADD COLUMN IF NOT EXISTS choreographer_furigana TEXT,
ADD COLUMN IF NOT EXISTS agreement_checked BOOLEAN DEFAULT FALSE;

-- 既存データの更新（participant_namesから代表者名とパートナ名を分離）
-- 手動で実行する場合は、以下のようなスクリプトを使用
-- UPDATE entries 
-- SET representative_name = SPLIT_PART(participant_names, E'\n', 1),
--     partner_name = SPLIT_PART(participant_names, E'\n', 2)
-- WHERE participant_names IS NOT NULL AND participant_names != '';

-- コメント追加
COMMENT ON COLUMN entries.representative_name IS '代表者の氏名';
COMMENT ON COLUMN entries.representative_furigana IS '代表者のフリガナ';
COMMENT ON COLUMN entries.partner_name IS 'パートナの氏名';
COMMENT ON COLUMN entries.partner_furigana IS 'パートナのフリガナ';
COMMENT ON COLUMN entries.choreographer_furigana IS '振付師のフリガナ';
COMMENT ON COLUMN entries.agreement_checked IS '参加資格への同意フラグ';