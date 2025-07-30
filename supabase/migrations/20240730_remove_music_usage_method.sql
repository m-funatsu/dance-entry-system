-- Remove music_usage_method column from semifinals_info and finals_info tables
ALTER TABLE semifinals_info DROP COLUMN IF EXISTS music_usage_method;
ALTER TABLE finals_info DROP COLUMN IF EXISTS music_usage_method;