-- applications_infoテーブルにメイク・ヘアメイク予約申請のカラムを追加
ALTER TABLE applications_info
ADD COLUMN IF NOT EXISTS makeup_preferred_stylist TEXT,
ADD COLUMN IF NOT EXISTS makeup_name TEXT,
ADD COLUMN IF NOT EXISTS makeup_email TEXT,
ADD COLUMN IF NOT EXISTS makeup_phone TEXT,
ADD COLUMN IF NOT EXISTS makeup_notes TEXT,
ADD COLUMN IF NOT EXISTS makeup_style1 TEXT,
ADD COLUMN IF NOT EXISTS makeup_style2 TEXT;