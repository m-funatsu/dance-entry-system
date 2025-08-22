-- PDFファイルタイプをentry_filesテーブルに追加

-- 現在の制約を削除
ALTER TABLE entry_files DROP CONSTRAINT IF EXISTS entry_files_file_type_check;

-- 新しい制約を追加（PDFを含む）
ALTER TABLE entry_files 
ADD CONSTRAINT entry_files_file_type_check 
CHECK (file_type IN ('music', 'audio', 'photo', 'video', 'pdf'));

-- コメント更新
COMMENT ON COLUMN entry_files.file_type IS 'ファイルタイプ: music, audio, photo, video, pdf';