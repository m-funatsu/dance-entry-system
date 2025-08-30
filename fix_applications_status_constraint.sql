-- applications_info_statusの制約を正しい値に修正

-- 既存の制約を削除
ALTER TABLE entries DROP CONSTRAINT IF EXISTS check_applications_info_status;

-- 正しい制約を追加（申請なし/申請あり）
ALTER TABLE entries ADD CONSTRAINT check_applications_info_status 
CHECK (applications_info_status IN ('申請なし', '申請あり'));

-- 現在のデータで制約違反があれば修正
UPDATE entries 
SET applications_info_status = '申請なし' 
WHERE applications_info_status NOT IN ('申請なし', '申請あり');