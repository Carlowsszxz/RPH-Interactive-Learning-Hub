-- Add these RLS policies to your game_leaderboard table if not already present

-- Users can update their own leaderboard entry
DROP POLICY IF EXISTS "Users can update own leaderboard" ON public.game_leaderboard;
CREATE POLICY "Users can update own leaderboard"
  ON public.game_leaderboard
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can create their own leaderboard entry
DROP POLICY IF EXISTS "Users can create leaderboard entry" ON public.game_leaderboard;
CREATE POLICY "Users can create leaderboard entry"
  ON public.game_leaderboard
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Optional: If game_sessions table doesn't exist, you can drop the foreign key constraint
-- ALTER TABLE public.game_scores DROP CONSTRAINT IF EXISTS fk_scores_session;

-- Or add game_sessions table if you want to track game sessions:
-- CREATE TABLE IF NOT EXISTS public.game_sessions (
--   id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL,
--   game_type VARCHAR(100) NOT NULL,
--   started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   ended_at TIMESTAMP WITH TIME ZONE,
--   status VARCHAR(50) DEFAULT 'active',
--   CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
-- );
