-- user_sessionsテーブルの作成
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  invalidated_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- インデックス
  CONSTRAINT user_sessions_user_id_idx FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX idx_user_sessions_created_at ON user_sessions(created_at);

-- RLSポリシー
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のセッションのみ閲覧可能
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- セッションの作成・更新・削除はサービスロールのみ
CREATE POLICY "Service role can manage sessions" ON user_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- 期限切れセッションの自動クリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = FALSE,
      invalidated_at = NOW()
  WHERE is_active = TRUE
    AND (
      -- アイドルタイムアウト（30分）
      last_activity < NOW() - INTERVAL '30 minutes'
      OR
      -- 絶対タイムアウト（24時間）
      created_at < NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 古いセッションレコードの削除関数（30日以上前）
CREATE OR REPLACE FUNCTION delete_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions
  WHERE invalidated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- コメント
COMMENT ON TABLE user_sessions IS 'ユーザーセッション管理テーブル';
COMMENT ON COLUMN user_sessions.id IS 'セッションID';
COMMENT ON COLUMN user_sessions.user_id IS 'ユーザーID';
COMMENT ON COLUMN user_sessions.created_at IS 'セッション作成日時';
COMMENT ON COLUMN user_sessions.last_activity IS '最終アクティビティ日時';
COMMENT ON COLUMN user_sessions.invalidated_at IS 'セッション無効化日時';
COMMENT ON COLUMN user_sessions.ip_address IS 'IPアドレス';
COMMENT ON COLUMN user_sessions.user_agent IS 'ユーザーエージェント';
COMMENT ON COLUMN user_sessions.is_active IS 'アクティブフラグ';