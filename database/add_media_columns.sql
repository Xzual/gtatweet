-- Migration: Add media carousel support to posts table
-- Created: February 18, 2026
-- Description: Adds columns to support multiple media (images/videos) per post

-- Add media column to store array of media objects
ALTER TABLE posts ADD COLUMN media jsonb DEFAULT NULL;

-- Add flag to identify posts with multiple media
ALTER TABLE posts ADD COLUMN has_multiple_media boolean DEFAULT false;

-- Create index on media column for better query performance
CREATE INDEX idx_posts_has_multiple_media ON posts(has_multiple_media);

-- Update existing posts with single media to have the media array
-- This handles backward compatibility
UPDATE posts 
SET media = json_build_array(
  json_build_object(
    'url', image_url,
    'type', COALESCE(media_type, 'image')
  )
)
WHERE image_url IS NOT NULL AND media IS NULL;

-- Verify the changes
-- SELECT id, image_url, media, has_multiple_media FROM posts LIMIT 5;
