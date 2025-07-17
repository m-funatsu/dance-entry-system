-- 通知テンプレートテーブルを作成
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを追加
CREATE INDEX idx_notification_templates_category ON notification_templates(category);
CREATE INDEX idx_notification_templates_is_active ON notification_templates(is_active);
CREATE INDEX idx_notification_templates_created_at ON notification_templates(created_at);

-- Row Level Security (RLS) を有効化
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- 管理者のみアクセス可能なポリシーを作成
CREATE POLICY "Admin can view all notification templates" ON notification_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can insert notification templates" ON notification_templates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can update notification templates" ON notification_templates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can delete notification templates" ON notification_templates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- テンプレートの更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_notification_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_templates_updated_at();

-- 初期テンプレートを挿入
INSERT INTO notification_templates (name, description, subject, body, category) VALUES
('選考結果通知（合格）', '選考に合格した参加者への通知', '【{{competition_name}}】選考結果のお知らせ', 
'{{representative_name}}様

この度は{{competition_name}}にご応募いただき、ありがとうございました。

厳正な審査の結果、{{representative_name}}様・{{partner_name}}様のペアにつきましては、
本選への出場権を獲得されましたことをお知らせいたします。

おめでとうございます！

詳細につきましては、別途ご連絡させていただきます。

{{organization_name}}', 'selection'),

('選考結果通知（不合格）', '選考に不合格だった参加者への通知', '【{{competition_name}}】選考結果のお知らせ', 
'{{representative_name}}様

この度は{{competition_name}}にご応募いただき、ありがとうございました。

厳正な審査の結果、{{representative_name}}様・{{partner_name}}様のペアにつきましては、
今回は本選への出場には至りませんでした。

今後ともよろしくお願いいたします。

{{organization_name}}', 'selection'),

('エントリー受付完了', 'エントリー受付完了の通知', '【{{competition_name}}】エントリー受付完了', 
'{{representative_name}}様

この度は{{competition_name}}にエントリーいただき、ありがとうございました。

エントリー内容を確認いたしました。
選考結果は{{selection_date}}頃にご連絡予定です。

今しばらくお待ちください。

{{organization_name}}', 'entry'),

('リマインダー通知', '重要な期限のリマインダー', '【{{competition_name}}】{{reminder_subject}}', 
'{{representative_name}}様

{{competition_name}}に関する重要なお知らせです。

{{reminder_content}}

期限: {{deadline_date}}

ご不明な点がございましたら、お気軽にお問い合わせください。

{{organization_name}}', 'reminder');

-- コメント追加
COMMENT ON TABLE notification_templates IS '通知テンプレートテーブル';
COMMENT ON COLUMN notification_templates.name IS 'テンプレート名';
COMMENT ON COLUMN notification_templates.description IS 'テンプレートの説明';
COMMENT ON COLUMN notification_templates.subject IS 'メール件名テンプレート';
COMMENT ON COLUMN notification_templates.body IS 'メール本文テンプレート';
COMMENT ON COLUMN notification_templates.category IS 'カテゴリ（entry/selection/reminder/general）';
COMMENT ON COLUMN notification_templates.is_active IS 'アクティブ状態';
COMMENT ON COLUMN notification_templates.created_by IS '作成者のユーザーID';