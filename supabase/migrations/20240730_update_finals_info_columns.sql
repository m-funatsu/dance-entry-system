-- Update choreographer_attendance and choreographer_photo_permission columns to text type
ALTER TABLE finals_info 
  ALTER COLUMN choreographer_attendance TYPE text,
  ALTER COLUMN choreographer_photo_permission TYPE text;

-- Drop any existing default values
ALTER TABLE finals_info 
  ALTER COLUMN choreographer_attendance DROP DEFAULT,
  ALTER COLUMN choreographer_photo_permission DROP DEFAULT;