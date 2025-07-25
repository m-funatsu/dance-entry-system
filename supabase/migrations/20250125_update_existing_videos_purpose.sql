-- 既存の予選動画にpurposeフィールドを設定
UPDATE entry_files
SET purpose = 'preliminary'
WHERE file_type = 'video' 
  AND purpose IS NULL
  AND entry_id IN (
    SELECT entry_id 
    FROM preliminary_info
  );