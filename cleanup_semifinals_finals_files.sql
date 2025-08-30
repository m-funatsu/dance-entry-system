-- 準決勝テーブルから決勝ファイルのURLを削除するSQL

-- 準決勝テーブルのchaser_songフィールドから決勝ファイル（/finals/パス）を削除
UPDATE semifinals_info 
SET chaser_song = NULL
WHERE chaser_song LIKE '%/finals/%';

-- 準決勝テーブルのmusic_data_pathフィールドから決勝ファイル（/finals/パス）を削除  
UPDATE semifinals_info 
SET music_data_path = NULL
WHERE music_data_path LIKE '%/finals/%';

-- その他の決勝ファイルも削除
UPDATE semifinals_info 
SET scene1_image_path = NULL
WHERE scene1_image_path LIKE '%/finals/%';

UPDATE semifinals_info 
SET scene2_image_path = NULL
WHERE scene2_image_path LIKE '%/finals/%';

UPDATE semifinals_info 
SET scene3_image_path = NULL
WHERE scene3_image_path LIKE '%/finals/%';

UPDATE semifinals_info 
SET scene4_image_path = NULL
WHERE scene4_image_path LIKE '%/finals/%';

UPDATE semifinals_info 
SET scene5_image_path = NULL
WHERE scene5_image_path LIKE '%/finals/%';

UPDATE semifinals_info 
SET chaser_exit_image_path = NULL
WHERE chaser_exit_image_path LIKE '%/finals/%';