/*
# Fix room_messages relationship with profiles
*/

-- Add relationship between room_messages and profiles
ALTER TABLE room_messages 
DROP CONSTRAINT IF EXISTS room_messages_user_id_fkey;

ALTER TABLE room_messages 
ADD CONSTRAINT room_messages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;