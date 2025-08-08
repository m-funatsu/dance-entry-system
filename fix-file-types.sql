-- scene2_image_pathファイルのfile_typeを修正（.jpgファイルなので画像として正しく設定）
UPDATE entry_files
SET file_type = 'photo'
WHERE purpose = 'scene2_image_path' 
AND file_name LIKE '%.jpg'
AND file_type = 'music';

-- デバッグ：現在のentry_filesテーブルの内容を確認
SELECT 
  id,
  entry_id,
  file_type,
  file_name,
  purpose,
  file_path
FROM entry_files
WHERE entry_id = '5337bafd-fc2b-4ae3-ac3c-4e8c31e12fab'
ORDER BY uploaded_at DESC;