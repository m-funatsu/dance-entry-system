-- semifinals_infoテーブルにwork_title_kanaカラムを追加
ALTER TABLE semifinals_info 
ADD COLUMN IF NOT EXISTS work_title_kana TEXT;

-- コメント追加
COMMENT ON COLUMN semifinals_info.work_title_kana IS '作品タイトルのふりがな';