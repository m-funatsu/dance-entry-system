-- CHECK制約を再追加するSQL

-- 基本、予選、プログラム、準決勝、決勝、SNS：3段階
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

-- 申請：2段階（申請なし/申請あり）
ALTER TABLE entries ADD CONSTRAINT check_applications_info_status 
CHECK (applications_info_status IN ('申請なし', '申請あり'));

-- NOT NULL制約も追加
ALTER TABLE entries ALTER COLUMN basic_info_status SET NOT NULL;
ALTER TABLE entries ALTER COLUMN preliminary_info_status SET NOT NULL;
ALTER TABLE entries ALTER COLUMN program_info_status SET NOT NULL;
ALTER TABLE entries ALTER COLUMN semifinals_info_status SET NOT NULL;
ALTER TABLE entries ALTER COLUMN finals_info_status SET NOT NULL;
ALTER TABLE entries ALTER COLUMN sns_info_status SET NOT NULL;
ALTER TABLE entries ALTER COLUMN applications_info_status SET NOT NULL;