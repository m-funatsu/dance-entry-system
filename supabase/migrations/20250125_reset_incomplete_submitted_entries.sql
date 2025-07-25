-- 不完全な状態でsubmittedになっているエントリーをpendingに戻す
-- 基本情報が不完全、または予選情報が不完全な場合

UPDATE entries
SET 
  status = 'pending',
  updated_at = CURRENT_TIMESTAMP
WHERE status = 'submitted'
  AND (
    -- 基本情報が存在しない
    NOT EXISTS (
      SELECT 1 FROM basic_info 
      WHERE basic_info.entry_id = entries.id
    )
    OR
    -- 予選情報が存在しない
    NOT EXISTS (
      SELECT 1 FROM preliminary_info 
      WHERE preliminary_info.entry_id = entries.id
    )
    OR
    -- 予選動画が存在しない
    NOT EXISTS (
      SELECT 1 FROM entry_files 
      WHERE entry_files.entry_id = entries.id 
        AND entry_files.file_type = 'video'
        AND entry_files.purpose = 'preliminary'
    )
    OR
    -- 基本情報の必須項目が不足している
    EXISTS (
      SELECT 1 FROM basic_info
      WHERE basic_info.entry_id = entries.id
        AND (
          dance_style IS NULL OR dance_style = ''
          OR representative_name IS NULL OR representative_name = ''
          OR representative_furigana IS NULL OR representative_furigana = ''
          OR representative_email IS NULL OR representative_email = ''
          OR partner_name IS NULL OR partner_name = ''
          OR partner_furigana IS NULL OR partner_furigana = ''
          OR phone_number IS NULL OR phone_number = ''
          OR choreographer IS NULL OR choreographer = ''
          OR choreographer_furigana IS NULL OR choreographer_furigana = ''
          OR agreement_checked = false
          OR privacy_policy_checked = false
        )
    )
    OR
    -- 予選情報の必須項目が不足している
    EXISTS (
      SELECT 1 FROM preliminary_info
      WHERE preliminary_info.entry_id = entries.id
        AND (
          work_title IS NULL OR work_title = ''
          OR work_story IS NULL OR work_story = ''
          OR music_title IS NULL OR music_title = ''
          OR cd_title IS NULL OR cd_title = ''
          OR artist IS NULL OR artist = ''
          OR record_number IS NULL OR record_number = ''
          OR jasrac_code IS NULL OR jasrac_code = ''
          OR music_type IS NULL OR music_type = ''
          OR music_rights_cleared IS NULL OR music_rights_cleared = ''
        )
    )
  );