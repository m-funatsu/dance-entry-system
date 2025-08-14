-- program_infoテーブルの画像パスを修正するSQL
-- 完全なURLが保存されている場合、相対パスに変換する

-- 現在のデータを確認
SELECT 
  entry_id,
  player_photo_path,
  semifinal_image1_path,
  semifinal_image2_path,
  semifinal_image3_path,
  semifinal_image4_path,
  final_player_photo_path,
  final_image1_path,
  final_image2_path,
  final_image3_path,
  final_image4_path
FROM program_info
WHERE player_photo_path LIKE 'https://%'
   OR semifinal_image1_path LIKE 'https://%'
   OR semifinal_image2_path LIKE 'https://%'
   OR semifinal_image3_path LIKE 'https://%'
   OR semifinal_image4_path LIKE 'https://%'
   OR final_player_photo_path LIKE 'https://%'
   OR final_image1_path LIKE 'https://%'
   OR final_image2_path LIKE 'https://%'
   OR final_image3_path LIKE 'https://%'
   OR final_image4_path LIKE 'https://%';

-- URLから相対パスを抽出する関数
-- 例: https://ckffwsmgtivqjqkhppkj.supabase.co/storage/v1/object/public/files/entry_id/filename.jpg
-- → entry_id/filename.jpg

-- パスをクリアする（テスト環境なので一旦NULLにリセット）
UPDATE program_info
SET 
  player_photo_path = NULL,
  semifinal_image1_path = NULL,
  semifinal_image2_path = NULL,
  semifinal_image3_path = NULL,
  semifinal_image4_path = NULL,
  final_player_photo_path = NULL,
  final_image1_path = NULL,
  final_image2_path = NULL,
  final_image3_path = NULL,
  final_image4_path = NULL
WHERE player_photo_path LIKE 'https://%'
   OR semifinal_image1_path LIKE 'https://%'
   OR semifinal_image2_path LIKE 'https://%'
   OR semifinal_image3_path LIKE 'https://%'
   OR semifinal_image4_path LIKE 'https://%'
   OR final_player_photo_path LIKE 'https://%'
   OR final_image1_path LIKE 'https://%'
   OR final_image2_path LIKE 'https://%'
   OR final_image3_path LIKE 'https://%'
   OR final_image4_path LIKE 'https://%';

-- 確認
SELECT 
  entry_id,
  player_photo_path,
  semifinal_image1_path,
  semifinal_image2_path,
  semifinal_image3_path,
  semifinal_image4_path
FROM program_info;