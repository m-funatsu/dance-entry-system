-- basic_infoテーブルにcategory_divisionカラムを追加
ALTER TABLE basic_info
ADD COLUMN IF NOT EXISTS category_division text;

-- 既存のレコードにデフォルト値を設定（dance_styleから推測）
UPDATE basic_info
SET category_division = 
  CASE 
    WHEN partner_name IS NOT NULL AND partner_name != '' THEN 'ペア'
    ELSE 'ソロ'
  END
WHERE category_division IS NULL;

-- 今後のレコードのためにNOT NULL制約を追加
ALTER TABLE basic_info
ALTER COLUMN category_division SET NOT NULL;

-- コメントを追加
COMMENT ON COLUMN basic_info.category_division IS 'カテゴリー区分（ソロ/ペア）';