-- finals_infoテーブルにwork_title_kanaカラムを追加
ALTER TABLE finals_info 
ADD COLUMN IF NOT EXISTS work_title_kana TEXT;

-- コメント追加
COMMENT ON COLUMN finals_info.work_title_kana IS '作品タイトルのフリガナ';