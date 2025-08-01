-- finals_infoテーブルのRLSポリシーを修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can manage their own finals info" ON finals_info;
DROP POLICY IF EXISTS "Admins can manage all finals info" ON finals_info;
DROP POLICY IF EXISTS "Service role can access all finals info" ON finals_info;

-- RLSを有効化（既に有効な場合もエラーにならない）
ALTER TABLE finals_info ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のエントリーの決勝情報を読み書きできる
CREATE POLICY "Users can manage their own finals info" ON finals_info
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = finals_info.entry_id 
      AND entries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = finals_info.entry_id 
      AND entries.user_id = auth.uid()
    )
  );

-- 管理者は全ての決勝情報を読み書きできる
CREATE POLICY "Admins can manage all finals info" ON finals_info
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Service roleは全てにアクセス可能
CREATE POLICY "Service role can access all finals info" ON finals_info
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anonユーザーは読み取りのみ可能
CREATE POLICY "Anon can read finals info" ON finals_info
  FOR SELECT
  TO anon
  USING (true);

-- テーブルの権限を確認
GRANT ALL ON finals_info TO authenticated;
GRANT ALL ON finals_info TO service_role;
GRANT SELECT ON finals_info TO anon;

-- choreographer_attendanceとchoreographer_photo_permissionをtext型に変更
ALTER TABLE finals_info 
  ALTER COLUMN choreographer_attendance TYPE text,
  ALTER COLUMN choreographer_photo_permission TYPE text;

-- デフォルト値を削除
ALTER TABLE finals_info 
  ALTER COLUMN choreographer_attendance DROP DEFAULT,
  ALTER COLUMN choreographer_photo_permission DROP DEFAULT;