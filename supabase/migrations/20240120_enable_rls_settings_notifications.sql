-- settingsテーブルのRLSを有効化
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- notification_templatesテーブルのRLSを有効化
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- settingsテーブルのポリシー
-- 管理者のみ全ての操作を許可
CREATE POLICY "管理者はsettingsを管理できる" ON public.settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 一般ユーザーは読み取りのみ許可（期限情報など必要な設定を取得するため）
CREATE POLICY "認証済みユーザーはsettingsを読み取りできる" ON public.settings
  FOR SELECT
  TO authenticated
  USING (true);

-- notification_templatesテーブルのポリシー
-- 管理者のみ全ての操作を許可
CREATE POLICY "管理者はnotification_templatesを管理できる" ON public.notification_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- システムは通知テンプレートを読み取りできる（通知送信時に必要）
CREATE POLICY "認証済みユーザーはnotification_templatesを読み取りできる" ON public.notification_templates
  FOR SELECT
  TO authenticated
  USING (true);