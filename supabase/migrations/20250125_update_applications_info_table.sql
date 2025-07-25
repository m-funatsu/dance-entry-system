-- applications_infoテーブルに抜けていたカラムを追加
ALTER TABLE applications_info
ADD COLUMN IF NOT EXISTS related2_relationship TEXT,
ADD COLUMN IF NOT EXISTS applications_notes TEXT;