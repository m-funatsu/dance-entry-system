-- 通知テンプレートのcategoryカラムを削除
ALTER TABLE notification_templates 
DROP COLUMN IF EXISTS category;