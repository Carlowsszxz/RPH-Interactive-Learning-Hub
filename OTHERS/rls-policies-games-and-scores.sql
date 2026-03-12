-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR GAME LEADERBOARDS AND SCORES
-- Execute this in Supabase SQL Editor to fix the 403 RLS permission errors
-- ============================================================================

-- ============================================================================
-- GAME LEADERBOARD POLICIES
-- ============================================================================

-- Public can view all leaderboard entries
DROP POLICY IF EXISTS "Anyone can view game leaderboard" ON public.game_leaderboard;
CREATE POLICY "Anyone can view game leaderboard"
  ON public.game_leaderboard
  FOR SELECT
  USING (TRUE);

-- Authenticated users can insert their own leaderboard entries
DROP POLICY IF EXISTS "Authenticated users can create leaderboard entries" ON public.game_leaderboard;
CREATE POLICY "Authenticated users can create leaderboard entries"
  ON public.game_leaderboard
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own leaderboard entries
DROP POLICY IF EXISTS "Users can update own leaderboard entries" ON public.game_leaderboard;
CREATE POLICY "Users can update own leaderboard entries"
  ON public.game_leaderboard
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIVIA SCORES POLICIES
-- ============================================================================

-- Anyone can view trivia scores (public leaderboard)
DROP POLICY IF EXISTS "Anyone can view trivia scores" ON public.trivia_scores;
CREATE POLICY "Anyone can view trivia scores"
  ON public.trivia_scores
  FOR SELECT
  USING (TRUE);

-- Authenticated users can create trivia scores (insert their own scores)
DROP POLICY IF EXISTS "Authenticated users can create trivia scores" ON public.trivia_scores;
CREATE POLICY "Authenticated users can create trivia scores"
  ON public.trivia_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own trivia scores
DROP POLICY IF EXISTS "Users can view own trivia scores" ON public.trivia_scores;
CREATE POLICY "Users can view own trivia scores"
  ON public.trivia_scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- TIMELINE SCORES POLICIES
-- ============================================================================

-- Anyone can view timeline scores (public leaderboard)
DROP POLICY IF EXISTS "Anyone can view timeline scores" ON public.timeline_scores;
CREATE POLICY "Anyone can view timeline scores"
  ON public.timeline_scores
  FOR SELECT
  USING (TRUE);

-- Authenticated users can create timeline scores (insert their own scores)
DROP POLICY IF EXISTS "Authenticated users can create timeline scores" ON public.timeline_scores;
CREATE POLICY "Authenticated users can create timeline scores"
  ON public.timeline_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own timeline scores
DROP POLICY IF EXISTS "Users can view own timeline scores" ON public.timeline_scores;
CREATE POLICY "Users can view own timeline scores"
  ON public.timeline_scores
  FOR SELECT
  USING (auth.uid() = user_id);
