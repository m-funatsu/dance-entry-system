-- 基本情報のステータスカラムを追加
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS basic_info_status TEXT DEFAULT '未入力';

-- コメント追加
COMMENT ON COLUMN entries.basic_info_status IS '基本情報の入力ステータス（未入力/登録済み）';

-- 既存のレコードのステータスを更新（basic_infoテーブルにデータがある場合は「登録済み」に設定）
UPDATE entries 
SET basic_info_status = '登録済み' 
WHERE id IN (
  SELECT DISTINCT entry_id 
  FROM basic_info 
  WHERE entry_id IS NOT NULL 
    AND dance_style IS NOT NULL 
    AND dance_style != ''
    AND representative_name IS NOT NULL 
    AND representative_name != ''
    AND partner_name IS NOT NULL 
    AND partner_name != ''
    AND agreement_checked = true
    AND media_consent_checked = true
    AND privacy_policy_checked = true
);