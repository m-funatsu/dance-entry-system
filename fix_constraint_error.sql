-- CHECK制約エラーを解決するためのSQL
-- 一時的に制約を削除してからデータを更新し、制約を再追加

-- 1. すべてのCHECK制約を削除
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_basic_info_status;
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_preliminary_info_status;
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_program_info_status;
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_semifinals_info_status;
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_finals_info_status;
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_sns_info_status;
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_applications_info_status;

-- 2. 既存のNULL値をデフォルト値で更新
UPDATE entries SET basic_info_status = '未登録' WHERE basic_info_status IS NULL;
UPDATE entries SET preliminary_info_status = '未登録' WHERE preliminary_info_status IS NULL;
UPDATE entries SET program_info_status = '未登録' WHERE program_info_status IS NULL;
UPDATE entries SET semifinals_info_status = '未登録' WHERE semifinals_info_status IS NULL;
UPDATE entries SET finals_info_status = '未登録' WHERE finals_info_status IS NULL;
UPDATE entries SET sns_info_status = '未登録' WHERE sns_info_status IS NULL;
UPDATE entries SET applications_info_status = '未登録' WHERE applications_info_status IS NULL;

-- 3. カラムにNOT NULL制約を追加
ALTER TABLE entries ALTER COLUMN basic_info_status SET NOT NULL;
ALTER TABLE entries ALTER COLUMN preliminary_info_status SET NOT NULL;
ALTER TABLE entries ALTER COLUMN program_info_status SET NOT NULL;
ALTER TABLE entries ALTER COLUMN semifinals_info_status SET NOT NULL;
ALTER TABLE entries ALTER COLUMN finals_info_status SET NOT NULL;
ALTER TABLE entries ALTER COLUMN sns_info_status SET NOT NULL;
ALTER TABLE entries ALTER COLUMN applications_info_status SET NOT NULL;

-- 4. CHECK制約を再追加
ALTER TABLE entries ADD CONSTRAINT check_basic_info_status 
CHECK (basic_info_status IN ('未登録', '入力中', '登録済み'));

ALTER TABLE entries ADD CONSTRAINT check_preliminary_info_status 
CHECK (preliminary_info_status IN ('未登録', '入力中', '登録済み'));

ALTER TABLE entries ADD CONSTRAINT check_program_info_status 
CHECK (program_info_status IN ('未登録', '入力中', '登録済み'));

ALTER TABLE entries ADD CONSTRAINT check_semifinals_info_status 
CHECK (semifinals_info_status IN ('未登録', '入力中', '登録済み'));

ALTER TABLE entries ADD CONSTRAINT check_finals_info_status 
CHECK (finals_info_status IN ('未登録', '入力中', '登録済み'));

ALTER TABLE entries ADD CONSTRAINT check_sns_info_status 
CHECK (sns_info_status IN ('未登録', '入力中', '登録済み'));

ALTER TABLE entries ADD CONSTRAINT check_applications_info_status 
CHECK (applications_info_status IN ('未登録', '入力中', '登録済み'));