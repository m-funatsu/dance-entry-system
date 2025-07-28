-- copyright_permissionフィールドの型をBOOLEANからTEXTに変更
ALTER TABLE semifinals_info 
ALTER COLUMN copyright_permission TYPE TEXT
USING CASE 
    WHEN copyright_permission = true THEN 'commercial'
    WHEN copyright_permission = false THEN NULL
    ELSE NULL
END;