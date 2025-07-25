-- 楽曲著作権許諾フィールドをBOOLEAN型からTEXT型に変更
ALTER TABLE preliminary_info 
ALTER COLUMN music_rights_cleared TYPE TEXT 
USING CASE 
  WHEN music_rights_cleared = true THEN 'A'
  ELSE 'A'
END;

-- デフォルト値を設定
ALTER TABLE preliminary_info 
ALTER COLUMN music_rights_cleared SET DEFAULT 'A';

-- NOT NULL制約を追加
ALTER TABLE preliminary_info 
ALTER COLUMN music_rights_cleared SET NOT NULL;

-- コメントを追加
COMMENT ON COLUMN preliminary_info.music_rights_cleared IS 'A: 市販の楽曲を使用する, B: 自身で著作権に対し許諾を取った楽曲を使用する, C: 独自に製作されたオリジナル楽曲を使用する';