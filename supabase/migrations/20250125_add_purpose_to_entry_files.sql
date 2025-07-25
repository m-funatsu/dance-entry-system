-- entry_filesテーブルにpurposeカラムを追加
ALTER TABLE entry_files 
ADD COLUMN purpose TEXT;

-- コメントを追加
COMMENT ON COLUMN entry_files.purpose IS '用途: preliminary（予選）, semifinals（準決勝）, finals（決勝）, program（プログラム掲載用）など';