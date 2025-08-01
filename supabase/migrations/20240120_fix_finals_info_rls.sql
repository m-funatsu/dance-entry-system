-- finals_infoテーブルが存在することを確認
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'finals_info'
) as table_exists;

-- RLSポリシーを一度削除して再作成
DROP POLICY IF EXISTS "Users can manage their own finals info" ON finals_info;
DROP POLICY IF EXISTS "Admins can manage all finals info" ON finals_info;

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

-- テーブルの権限を確認
GRANT ALL ON finals_info TO authenticated;
GRANT ALL ON finals_info TO service_role;
GRANT SELECT ON finals_info TO anon;

-- APIでアクセス可能か確認
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'finals_info';

-- RLSポリシーが正しく設定されているか確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'finals_info';