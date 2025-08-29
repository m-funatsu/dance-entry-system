-- シンプルな制約修正SQL（段階的実行用）

-- 1. 既存の制約をすべて削除
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_basic_info_status;
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_preliminary_info_status;
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_program_info_status;
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_semifinals_info_status;
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_finals_info_status;
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_sns_info_status;
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_applications_info_status;

-- 2. 既存データをクリーンアップ（段階的に実行）
-- まず現在のapplications_info_statusの値を確認
SELECT id, applications_info_status FROM entries WHERE applications_info_status IS NOT NULL;

-- 不正な値を修正
UPDATE entries SET applications_info_status = '申請なし' WHERE applications_info_status NOT IN ('申請なし', '申請あり');
UPDATE entries SET applications_info_status = '申請なし' WHERE applications_info_status IS NULL;

-- その他のステータスも修正
UPDATE entries SET basic_info_status = '未登録' WHERE basic_info_status IS NULL;
UPDATE entries SET preliminary_info_status = '未登録' WHERE preliminary_info_status IS NULL;
UPDATE entries SET program_info_status = '未登録' WHERE program_info_status IS NULL;
UPDATE entries SET semifinals_info_status = '未登録' WHERE semifinals_info_status IS NULL;
UPDATE entries SET finals_info_status = '未登録' WHERE finals_info_status IS NULL;
UPDATE entries SET sns_info_status = '未登録' WHERE sns_info_status IS NULL;