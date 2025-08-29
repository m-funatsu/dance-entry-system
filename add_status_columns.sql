-- エントリーテーブルにステータスカラムを追加するSQL
-- 各フォームの完了状況を管理するためのカラム

-- 基本情報ステータス
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS basic_info_status TEXT DEFAULT '未登録';

-- 予選情報ステータス  
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS preliminary_info_status TEXT DEFAULT '未登録';

-- プログラム情報ステータス
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS program_info_status TEXT DEFAULT '未登録';

-- 準決勝情報ステータス
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS semifinals_info_status TEXT DEFAULT '未登録';

-- 決勝情報ステータス
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS finals_info_status TEXT DEFAULT '未登録';

-- SNS情報ステータス
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS sns_info_status TEXT DEFAULT '未登録';

-- 各種申請情報ステータス
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS applications_info_status TEXT DEFAULT '未登録';

-- ステータス値にCHECK制約を追加（データ整合性確保）
-- 既存の制約がある場合は無視されるように個別に実行

DO $$
BEGIN
    -- 基本情報ステータス制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_basic_info_status' AND table_name = 'entries'
    ) THEN
        ALTER TABLE entries ADD CONSTRAINT check_basic_info_status 
        CHECK (basic_info_status IN ('未登録', '入力中', '登録済み'));
    END IF;

    -- 予選情報ステータス制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_preliminary_info_status' AND table_name = 'entries'
    ) THEN
        ALTER TABLE entries ADD CONSTRAINT check_preliminary_info_status 
        CHECK (preliminary_info_status IN ('未登録', '入力中', '登録済み'));
    END IF;

    -- プログラム情報ステータス制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_program_info_status' AND table_name = 'entries'
    ) THEN
        ALTER TABLE entries ADD CONSTRAINT check_program_info_status 
        CHECK (program_info_status IN ('未登録', '入力中', '登録済み'));
    END IF;

    -- 準決勝情報ステータス制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_semifinals_info_status' AND table_name = 'entries'
    ) THEN
        ALTER TABLE entries ADD CONSTRAINT check_semifinals_info_status 
        CHECK (semifinals_info_status IN ('未登録', '入力中', '登録済み'));
    END IF;

    -- 決勝情報ステータス制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_finals_info_status' AND table_name = 'entries'
    ) THEN
        ALTER TABLE entries ADD CONSTRAINT check_finals_info_status 
        CHECK (finals_info_status IN ('未登録', '入力中', '登録済み'));
    END IF;

    -- SNS情報ステータス制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_sns_info_status' AND table_name = 'entries'
    ) THEN
        ALTER TABLE entries ADD CONSTRAINT check_sns_info_status 
        CHECK (sns_info_status IN ('未登録', '入力中', '登録済み'));
    END IF;

    -- 各種申請情報ステータス制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_applications_info_status' AND table_name = 'entries'
    ) THEN
        ALTER TABLE entries ADD CONSTRAINT check_applications_info_status 
        CHECK (applications_info_status IN ('未登録', '入力中', '登録済み'));
    END IF;
END $$;

-- コメント追加（管理目的）
COMMENT ON COLUMN entries.basic_info_status IS '基本情報の完了状況: 未登録/入力中/登録済み';
COMMENT ON COLUMN entries.preliminary_info_status IS '予選情報の完了状況: 未登録/入力中/登録済み';
COMMENT ON COLUMN entries.program_info_status IS 'プログラム情報の完了状況: 未登録/入力中/登録済み';
COMMENT ON COLUMN entries.semifinals_info_status IS '準決勝情報の完了状況: 未登録/入力中/登録済み';
COMMENT ON COLUMN entries.finals_info_status IS '決勝情報の完了状況: 未登録/入力中/登録済み';
COMMENT ON COLUMN entries.sns_info_status IS 'SNS情報の完了状況: 未登録/入力中/登録済み';
COMMENT ON COLUMN entries.applications_info_status IS '各種申請情報の完了状況: 未登録/入力中/登録済み';