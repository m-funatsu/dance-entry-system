-- sns_infoテーブルのRLSポリシーを修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can manage their own sns info" ON sns_info;
DROP POLICY IF EXISTS "Admins can manage all sns info" ON sns_info;
DROP POLICY IF EXISTS "Service role can access all sns info" ON sns_info;
DROP POLICY IF EXISTS "Anon can read sns info" ON sns_info;

-- RLSを有効化（既に有効な場合もエラーにならない）
ALTER TABLE sns_info ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のエントリーのSNS情報を読み書きできる
CREATE POLICY "Users can manage their own sns info" ON sns_info
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = sns_info.entry_id 
      AND entries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries 
      WHERE entries.id = sns_info.entry_id 
      AND entries.user_id = auth.uid()
    )
  );

-- 管理者は全てのSNS情報を読み書きできる
CREATE POLICY "Admins can manage all sns info" ON sns_info
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
CREATE POLICY "Service role can access all sns info" ON sns_info
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anonユーザーは読み取りのみ可能
CREATE POLICY "Anon can read sns info" ON sns_info
  FOR SELECT
  TO anon
  USING (true);

-- テーブルの権限を確認
GRANT ALL ON sns_info TO authenticated;
GRANT ALL ON sns_info TO service_role;
GRANT SELECT ON sns_info TO anon;