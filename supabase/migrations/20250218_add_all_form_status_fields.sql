-- 全フォームのステータスフィールドをentriesテーブルに追加

-- ステータスフィールドを追加
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS preliminary_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS semifinals_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS finals_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS program_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS sns_info_status text DEFAULT '入力中',
ADD COLUMN IF NOT EXISTS applications_info_status text DEFAULT '入力中';

-- ステータス値の制約を追加
ALTER TABLE entries 
ADD CONSTRAINT check_preliminary_info_status 
  CHECK (preliminary_info_status IN ('入力中', '登録済み')),
ADD CONSTRAINT check_semifinals_info_status 
  CHECK (semifinals_info_status IN ('入力中', '登録済み')),
ADD CONSTRAINT check_finals_info_status 
  CHECK (finals_info_status IN ('入力中', '登録済み')),
ADD CONSTRAINT check_program_info_status 
  CHECK (program_info_status IN ('入力中', '登録済み')),
ADD CONSTRAINT check_sns_info_status 
  CHECK (sns_info_status IN ('入力中', '登録済み')),
ADD CONSTRAINT check_applications_info_status 
  CHECK (applications_info_status IN ('入力中', '登録済み'));

-- インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_entries_preliminary_info_status ON entries(preliminary_info_status);
CREATE INDEX IF NOT EXISTS idx_entries_semifinals_info_status ON entries(semifinals_info_status);
CREATE INDEX IF NOT EXISTS idx_entries_finals_info_status ON entries(finals_info_status);
CREATE INDEX IF NOT EXISTS idx_entries_program_info_status ON entries(program_info_status);
CREATE INDEX IF NOT EXISTS idx_entries_sns_info_status ON entries(sns_info_status);
CREATE INDEX IF NOT EXISTS idx_entries_applications_info_status ON entries(applications_info_status);

-- コメントを追加
COMMENT ON COLUMN entries.preliminary_info_status IS '予選情報フォームの提出ステータス';
COMMENT ON COLUMN entries.semifinals_info_status IS '準決勝情報フォームの提出ステータス';
COMMENT ON COLUMN entries.finals_info_status IS '決勝情報フォームの提出ステータス';
COMMENT ON COLUMN entries.program_info_status IS 'プログラム情報フォームの提出ステータス';
COMMENT ON COLUMN entries.sns_info_status IS 'SNS情報フォームの提出ステータス';
COMMENT ON COLUMN entries.applications_info_status IS '各種申請フォームの提出ステータス';