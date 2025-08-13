-- basic_infoテーブルに不足しているカラムを追加するSQL
-- Supabase SQL Editorで実行してください

-- 1. エントリー者のローマ字と生年月日
ALTER TABLE basic_info 
ADD COLUMN IF NOT EXISTS representative_romaji TEXT,
ADD COLUMN IF NOT EXISTS representative_birthdate DATE;

-- 2. ペアのローマ字と生年月日
ALTER TABLE basic_info 
ADD COLUMN IF NOT EXISTS partner_romaji TEXT,
ADD COLUMN IF NOT EXISTS partner_birthdate DATE;

-- 3. 本名情報
ALTER TABLE basic_info 
ADD COLUMN IF NOT EXISTS real_name TEXT,
ADD COLUMN IF NOT EXISTS real_name_kana TEXT,
ADD COLUMN IF NOT EXISTS partner_real_name TEXT,
ADD COLUMN IF NOT EXISTS partner_real_name_kana TEXT;

-- 4. 緊急連絡先情報
ALTER TABLE basic_info 
ADD COLUMN IF NOT EXISTS emergency_contact_name_1 TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone_1 TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name_2 TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone_2 TEXT;

-- 5. 保護者情報（18歳未満の場合）
ALTER TABLE basic_info 
ADD COLUMN IF NOT EXISTS guardian_name TEXT,
ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
ADD COLUMN IF NOT EXISTS guardian_email TEXT,
ADD COLUMN IF NOT EXISTS partner_guardian_name TEXT,
ADD COLUMN IF NOT EXISTS partner_guardian_phone TEXT,
ADD COLUMN IF NOT EXISTS partner_guardian_email TEXT;

-- 6. 同意チェックボックス（既に存在する可能性があるが念のため）
ALTER TABLE basic_info 
ADD COLUMN IF NOT EXISTS agreement_checked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS media_consent_checked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_policy_checked BOOLEAN DEFAULT false;

-- カラム追加後、テーブル構造を確認
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'basic_info' 
-- ORDER BY ordinal_position;