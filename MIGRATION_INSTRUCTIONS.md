# データベースマイグレーション手順

## 2025年1月13日 - category_divisionカラムの追加

### 問題
basic_infoテーブルに`category_division`カラムが存在しないため、基本情報の保存時にエラーが発生します。

### 解決方法

以下のSQLをSupabaseのSQL Editorで実行してください：

```sql
-- basic_infoテーブルにcategory_divisionカラムを追加
ALTER TABLE basic_info
ADD COLUMN IF NOT EXISTS category_division text;

-- 既存のレコードにデフォルト値を設定（dance_styleから推測）
UPDATE basic_info
SET category_division = 
  CASE 
    WHEN partner_name IS NOT NULL AND partner_name != '' THEN 'ペア'
    ELSE 'ソロ'
  END
WHERE category_division IS NULL;

-- 今後のレコードのためにNOT NULL制約を追加
ALTER TABLE basic_info
ALTER COLUMN category_division SET NOT NULL;

-- コメントを追加
COMMENT ON COLUMN basic_info.category_division IS 'カテゴリー区分（ソロ/ペア）';
```

### 実行手順

1. Supabaseダッシュボードにログイン
2. 対象のプロジェクトを選択
3. 左側のメニューから「SQL Editor」を選択
4. 上記のSQLをコピーして貼り付け
5. 「Run」ボタンをクリックして実行

### 確認方法

以下のSQLを実行して、カラムが正しく追加されたことを確認：

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'basic_info' 
AND column_name = 'category_division';
```

### エラーが続く場合

もしエラーが続く場合は、ブラウザのキャッシュをクリアするか、以下のコマンドを実行してください：

```bash
# Next.jsのキャッシュをクリア
rm -rf .next
npm run build
npm run dev
```