-- Step 1: Add followers_count and verified columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS followers_count bigint DEFAULT 0;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- Step 2: Update @Xzual profile with followers count and verified badge
UPDATE profiles
SET 
  followers_count = 5200000,
  verified = true
WHERE 
  id = 'bc867c59-e8bc-4000-9c28-5ad02f51d1e5';

-- Step 3: Verify the update
SELECT id, username, display_name, followers_count, verified 
FROM profiles 
WHERE id = 'bc867c59-e8bc-4000-9c28-5ad02f51d1e5';
