-- 準決勝情報テーブルのboolean型カラムのデフォルト値を削除
ALTER TABLE semifinals_info 
  ALTER COLUMN music_change_from_preliminary DROP DEFAULT,
  ALTER COLUMN choreographer_change_from_preliminary DROP DEFAULT;