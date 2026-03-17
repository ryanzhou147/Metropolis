-- Drop the legacy s3_url column from content_table.
-- image_url is now the canonical media URL column (direct URLs, not Cloudinary public IDs).
ALTER TABLE content_table DROP COLUMN IF EXISTS s3_url;
