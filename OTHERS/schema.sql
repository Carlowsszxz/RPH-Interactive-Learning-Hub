-- ============================================================================
-- REFACTORED DATABASE SCHEMA
-- Comprehensive normalization and proper interconnectivity
-- ============================================================================

-- ============================================================================
-- 0. HELPER FUNCTIONS (Must be first!)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. CORE USER & AUTHENTICATION EXTENSIONS
-- ============================================================================

-- Extend auth.users with profile information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL PRIMARY KEY DEFAULT auth.uid(),
  user_email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  student_id VARCHAR(50) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user_profiles_auth_users FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_profiles_email ON public.user_profiles(user_email);
CREATE INDEX idx_user_profiles_student_id ON public.user_profiles(student_id);

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. CLASS MANAGEMENT SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.classes (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name VARCHAR(255) NOT NULL,
  description TEXT,
  class_code VARCHAR(10) NOT NULL UNIQUE,
  instructor_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_classes_instructor FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT classes_status_check CHECK (status IN ('active', 'upcoming', 'archived'))
);

CREATE INDEX idx_classes_status ON public.classes(status);
CREATE INDEX idx_classes_instructor_id ON public.classes(instructor_id);
CREATE INDEX idx_classes_code ON public.classes(class_code);

CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Class enrollment with proper role management
CREATE TABLE IF NOT EXISTS public.class_enrollments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  class_id UUID NOT NULL,
  role VARCHAR(50) DEFAULT 'student',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
  CONSTRAINT enrollments_role_check CHECK (role IN ('instructor', 'student')),
  CONSTRAINT unique_user_class_enrollment UNIQUE (user_id, class_id)
);

CREATE INDEX idx_enrollments_user_id ON public.class_enrollments(user_id);
CREATE INDEX idx_enrollments_class_id ON public.class_enrollments(class_id);
CREATE INDEX idx_enrollments_user_class ON public.class_enrollments(user_id, class_id);

-- ============================================================================
-- 3. EDUCATIONAL CONTENT SYSTEM
-- ============================================================================

-- Topics/Units within classes
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_topics_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE
);

CREATE INDEX idx_topics_class_id ON public.topics(class_id);

CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Class Resources (Images, Documents, etc.)
CREATE TABLE IF NOT EXISTS public.class_resources (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  topic_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  resource_url TEXT NOT NULL,
  resource_type VARCHAR(50) DEFAULT 'image',
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_resources_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_resources_topic FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE SET NULL,
  CONSTRAINT fk_resources_uploader FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE RESTRICT,
  CONSTRAINT resource_type_check CHECK (resource_type IN ('image', 'document', 'video', 'other'))
);

CREATE INDEX idx_resources_class_id ON public.class_resources(class_id);
CREATE INDEX idx_resources_type ON public.class_resources(resource_type);

CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.class_resources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  topic_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  max_score INTEGER DEFAULT 100,
  created_by UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_assignments_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignments_topic FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE SET NULL,
  CONSTRAINT fk_assignments_creator FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX idx_assignments_topic_id ON public.assignments(topic_id);
CREATE INDEX idx_assignments_due_date ON public.assignments(due_date);

CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Assignment submissions (DEPRECATED - migrate to activity_submissions)
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL,
  activity_id UUID,
  user_id UUID NOT NULL,
  submission_text TEXT,
  submission_url TEXT,
  score INTEGER,
  feedback TEXT,
  status VARCHAR(50) DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_submissions_activity FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE SET NULL,
  CONSTRAINT fk_submissions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_submissions_grader FOREIGN KEY (graded_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT unique_user_assignment_submission UNIQUE (assignment_id, user_id),
  CONSTRAINT submission_status_check CHECK (status IN ('draft', 'submitted', 'graded', 'late'))
);

CREATE INDEX idx_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_user_id ON public.assignment_submissions(user_id);
CREATE INDEX idx_submissions_status ON public.assignment_submissions(status);

CREATE TRIGGER update_assignment_submissions_updated_at
BEFORE UPDATE ON public.assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3B. UNIFIED ACTIVITIES SYSTEM (Assignments, Quizzes, Reflections, Discussions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL,
  class_id UUID NOT NULL,
  topic_id UUID,
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  prompt TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  points INTEGER DEFAULT 100,
  time_limit INTEGER,
  min_words INTEGER,
  max_attempts INTEGER DEFAULT NULL,
  submission_type VARCHAR(50) DEFAULT 'file',
  allow_late_submission BOOLEAN DEFAULT TRUE,
  show_grading_criteria BOOLEAN DEFAULT FALSE,
  allow_peer_review BOOLEAN DEFAULT FALSE,
  require_submission BOOLEAN DEFAULT FALSE,
  require_reply BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  notify_students BOOLEAN DEFAULT FALSE,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  file_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_activities_instructor FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_activities_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_activities_topic FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE SET NULL,
  CONSTRAINT activity_type_check CHECK (activity_type IN ('assignment', 'quiz', 'reflection', 'discussion')),
  CONSTRAINT submission_type_check CHECK (submission_type IN ('file', 'text', 'both', 'quiz', 'reflection'))
);

CREATE INDEX idx_activities_instructor_id ON public.activities(instructor_id);
CREATE INDEX idx_activities_class_id ON public.activities(class_id);
CREATE INDEX idx_activities_topic_id ON public.activities(topic_id);
CREATE INDEX idx_activities_type ON public.activities(activity_type);
CREATE INDEX idx_activities_due_date ON public.activities(due_date);
CREATE INDEX idx_activities_is_published ON public.activities(is_published);

CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3C. UNIFIED ACTIVITY SUBMISSIONS SYSTEM
-- ============================================================================

-- Unified activity submissions (replaces assignment_submissions, quiz_attempts tracking)
CREATE TABLE IF NOT EXISTS public.activity_submissions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL,
  user_id UUID NOT NULL,
  submission_text TEXT,
  submission_urls TEXT,
  score INTEGER,
  grade_letter VARCHAR(2),
  feedback TEXT,
  status VARCHAR(50) DEFAULT 'submitted',
  attempt_number INTEGER DEFAULT 1,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_activity_submissions_activity FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_submissions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_submissions_grader FOREIGN KEY (graded_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT submission_status_check CHECK (status IN ('draft', 'submitted', 'graded', 'late')),
  CONSTRAINT unique_activity_submission UNIQUE (activity_id, user_id, attempt_number)
);

-- Add these RLS policies to your game_leaderboard table if not already present

-- Users can update their own leaderboard entry
CREATE POLICY IF NOT EXISTS "Users can update own leaderboard"
  ON public.game_leaderboard
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can create their own leaderboard entry
CREATE POLICY IF NOT EXISTS "Users can create leaderboard entry"
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


CREATE INDEX idx_activity_submissions_activity_id ON public.activity_submissions(activity_id);
CREATE INDEX idx_activity_submissions_user_id ON public.activity_submissions(user_id);
CREATE INDEX idx_activity_submissions_status ON public.activity_submissions(status);
CREATE INDEX idx_activity_submissions_submitted_at ON public.activity_submissions(submitted_at DESC);

CREATE TRIGGER update_activity_submissions_updated_at
BEFORE UPDATE ON public.activity_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3D. ACTIVITY-BASED QUIZ QUESTIONS
-- ============================================================================

-- Link quiz questions to activities
CREATE TABLE IF NOT EXISTS public.activity_quiz_questions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  question_order INTEGER,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_activity_quiz_questions_activity FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE,
  CONSTRAINT question_type_check CHECK (question_type IN ('multiple_choice', 'short_answer', 'essay', 'true_false', 'matching'))
);

CREATE INDEX idx_activity_quiz_questions_activity_id ON public.activity_quiz_questions(activity_id);

CREATE TRIGGER update_activity_quiz_questions_updated_at
BEFORE UPDATE ON public.activity_quiz_questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Activity quiz options
CREATE TABLE IF NOT EXISTS public.activity_quiz_options (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  option_text TEXT NOT NULL,
  option_order INTEGER,
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_activity_quiz_options_question FOREIGN KEY (question_id) REFERENCES public.activity_quiz_questions(id) ON DELETE CASCADE
);

CREATE INDEX idx_activity_quiz_options_question_id ON public.activity_quiz_options(question_id);

-- Activity quiz responses
CREATE TABLE IF NOT EXISTS public.activity_quiz_responses (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL,
  question_id UUID NOT NULL,
  selected_option_id UUID,
  response_text TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_activity_quiz_responses_submission FOREIGN KEY (submission_id) REFERENCES public.activity_submissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_quiz_responses_question FOREIGN KEY (question_id) REFERENCES public.activity_quiz_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_quiz_responses_option FOREIGN KEY (selected_option_id) REFERENCES public.activity_quiz_options(id) ON DELETE SET NULL
);

CREATE INDEX idx_activity_quiz_responses_submission_id ON public.activity_quiz_responses(submission_id);
CREATE INDEX idx_activity_quiz_responses_question_id ON public.activity_quiz_responses(question_id);

CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  topic_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  max_score INTEGER DEFAULT 100,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  shuffle_questions BOOLEAN DEFAULT FALSE,
  show_correct_answers BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_quizzes_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_quizzes_topic FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE SET NULL,
  CONSTRAINT fk_quizzes_creator FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_quizzes_class_id ON public.quizzes(class_id);
CREATE INDEX idx_quizzes_topic_id ON public.quizzes(topic_id);

CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Quiz questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  question_order INTEGER,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE,
  CONSTRAINT question_type_check CHECK (question_type IN ('multiple_choice', 'short_answer', 'essay', 'true_false', 'matching'))
);

CREATE INDEX idx_questions_quiz_id ON public.quiz_questions(quiz_id);

CREATE TRIGGER update_quiz_questions_updated_at
BEFORE UPDATE ON public.quiz_questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Quiz options (only for multiple choice/true false)
CREATE TABLE IF NOT EXISTS public.quiz_options (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  option_text TEXT NOT NULL,
  option_order INTEGER,
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE
);

CREATE INDEX idx_options_question_id ON public.quiz_options(question_id);

-- Quiz attempts (DEPRECATED - use activity_submissions for unified tracking)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL,
  activity_id UUID,
  user_id UUID NOT NULL,
  score INTEGER,
  max_score INTEGER DEFAULT 100,
  percentage NUMERIC(5, 2),
  status VARCHAR(50) DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_minutes INTEGER,
  CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_activity FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE SET NULL,
  CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT attempt_status_check CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE INDEX idx_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX idx_attempts_status ON public.quiz_attempts(status);

-- Quiz responses
CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL,
  question_id UUID NOT NULL,
  selected_option_id UUID,
  response_text TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_responses_attempt FOREIGN KEY (attempt_id) REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_responses_question FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_responses_option FOREIGN KEY (selected_option_id) REFERENCES public.quiz_options(id) ON DELETE SET NULL
);

CREATE INDEX idx_responses_attempt_id ON public.quiz_responses(attempt_id);
CREATE INDEX idx_responses_question_id ON public.quiz_responses(question_id);

-- Quiz analytics (aggregated data)
CREATE TABLE IF NOT EXISTS public.quiz_analytics (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL UNIQUE,
  total_attempts INTEGER DEFAULT 0,
  average_score NUMERIC(5, 2),
  highest_score INTEGER,
  lowest_score INTEGER,
  completion_rate NUMERIC(5, 2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_analytics_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE
);

CREATE INDEX idx_analytics_quiz_id ON public.quiz_analytics(quiz_id);

-- ============================================================================
-- 5. UNIFIED LEADERBOARD & GAME SYSTEM
-- ============================================================================

-- Game sessions
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_type VARCHAR(100) NOT NULL,
  game_name VARCHAR(100) NOT NULL,
  difficulty VARCHAR(50) DEFAULT 'medium',
  topic VARCHAR(100),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX idx_sessions_game_type ON public.game_sessions(game_type);
CREATE INDEX idx_sessions_created_at ON public.game_sessions(started_at DESC);

-- Unified game scores
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  user_id UUID NOT NULL,
  game_type VARCHAR(100) NOT NULL,
  game_name VARCHAR(100) NOT NULL,
  score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  perfect_rounds INTEGER DEFAULT 0,
  total_rounds INTEGER DEFAULT 0,
  accuracy NUMERIC(5, 2) DEFAULT 0,
  time_seconds INTEGER DEFAULT 0,
  era_selected VARCHAR(100),
  performance_grade VARCHAR(2) DEFAULT 'D',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_scores_session FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  CONSTRAINT fk_scores_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_game_session UNIQUE (session_id, user_id)
);

CREATE INDEX idx_game_scores_user_game ON public.game_scores(user_id, game_type);
CREATE INDEX idx_game_scores_score ON public.game_scores(game_type, score DESC);
CREATE INDEX idx_game_scores_created_at ON public.game_scores(created_at DESC);

CREATE TRIGGER update_game_scores_updated_at
BEFORE UPDATE ON public.game_scores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Unified leaderboard (materialized view of top scores)
CREATE TABLE IF NOT EXISTS public.game_leaderboard (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_type VARCHAR(100) NOT NULL,
  game_name VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  total_plays INTEGER DEFAULT 0,
  average_score NUMERIC(5, 2),
  best_score INTEGER,
  last_played_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_leaderboard_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_game_leaderboard UNIQUE (user_id, game_type)
);

CREATE INDEX idx_leaderboard_game ON public.game_leaderboard(game_type);
CREATE INDEX idx_leaderboard_score ON public.game_leaderboard(score DESC);
CREATE INDEX idx_leaderboard_rank ON public.game_leaderboard(rank);

-- ============================================================================
-- 6. SPECIALIZED SCORING SYSTEMS
-- ============================================================================

-- Timeline game scores
CREATE TABLE IF NOT EXISTS public.timeline_scores (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 10,
  accuracy NUMERIC(5, 2) DEFAULT 0,
  time_taken INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  performance_grade VARCHAR(2) DEFAULT 'D',
  difficulty VARCHAR(20) DEFAULT 'medium',
  topic VARCHAR(100) DEFAULT 'All Topics',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_timeline_scores_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_timeline_scores_user_id ON public.timeline_scores(user_id);
CREATE INDEX idx_timeline_scores_topic ON public.timeline_scores(topic);
CREATE INDEX idx_timeline_scores_score ON public.timeline_scores(score DESC);

-- Trivia scores
CREATE TABLE IF NOT EXISTS public.trivia_scores (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 10,
  accuracy NUMERIC(5, 2) DEFAULT 0,
  time_taken INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  performance_grade VARCHAR(2) DEFAULT 'D',
  category VARCHAR(100),
  difficulty VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_trivia_scores_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_trivia_scores_user_id ON public.trivia_scores(user_id);
CREATE INDEX idx_trivia_scores_score ON public.trivia_scores(score DESC);
CREATE INDEX idx_trivia_scores_category ON public.trivia_scores(category);

-- ============================================================================
-- 7. DISCUSSION & ENGAGEMENT SYSTEM
-- ============================================================================

-- Forum topics
CREATE TABLE IF NOT EXISTS public.forum_topics (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  is_pinned BOOLEAN DEFAULT FALSE,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_forum_topics_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_forum_topics_creator FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_forum_topics_class_id ON public.forum_topics(class_id);
CREATE INDEX idx_forum_topics_created_by ON public.forum_topics(created_by);
CREATE INDEX idx_forum_topics_pinned ON public.forum_topics(is_pinned);

CREATE TRIGGER update_forum_topics_updated_at
BEFORE UPDATE ON public.forum_topics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Forum posts
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_posts_topic FOREIGN KEY (topic_id) REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_forum_posts_topic_id ON public.forum_posts(topic_id);
CREATE INDEX idx_forum_posts_author_id ON public.forum_posts(author_id);
CREATE INDEX idx_forum_posts_created_at ON public.forum_posts(created_at DESC);

CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Forum post replies
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_replies_post FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_replies_author FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_forum_replies_post_id ON public.forum_replies(post_id);
CREATE INDEX idx_forum_replies_author_id ON public.forum_replies(author_id);

CREATE TRIGGER update_forum_replies_updated_at
BEFORE UPDATE ON public.forum_replies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Post/reply likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  reply_id UUID,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_reply FOREIGN KEY (reply_id) REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_post_like UNIQUE (post_id, user_id),
  CONSTRAINT unique_reply_like UNIQUE (reply_id, user_id),
  CONSTRAINT check_likes CHECK (
    (post_id IS NOT NULL AND reply_id IS NULL) OR
    (post_id IS NULL AND reply_id IS NOT NULL)
  )
);

CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_reply_id ON public.post_likes(reply_id);

-- ============================================================================
-- 8. LEARNING TOOLS
-- ============================================================================

-- Concept maps
CREATE TABLE IF NOT EXISTS public.concept_maps (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID,
  topic_id UUID,
  root_word VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_maps_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL,
  CONSTRAINT fk_maps_topic FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE SET NULL,
  CONSTRAINT fk_maps_creator FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_concept_maps_active ON public.concept_maps(is_active);
CREATE INDEX idx_concept_maps_class_id ON public.concept_maps(class_id);

CREATE TRIGGER update_concept_maps_updated_at
BEFORE UPDATE ON public.concept_maps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Concept nodes
CREATE TABLE IF NOT EXISTS public.concept_nodes (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID NOT NULL,
  user_id UUID NOT NULL,
  word VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#4A90E2',
  parent_id UUID,
  relationship_label VARCHAR(100),
  position_x NUMERIC(10, 2),
  position_y NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_nodes_map FOREIGN KEY (map_id) REFERENCES public.concept_maps(id) ON DELETE CASCADE,
  CONSTRAINT fk_nodes_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_nodes_parent FOREIGN KEY (parent_id) REFERENCES public.concept_nodes(id) ON DELETE SET NULL
);

CREATE INDEX idx_concept_nodes_map_id ON public.concept_nodes(map_id);
CREATE INDEX idx_concept_nodes_user_id ON public.concept_nodes(user_id);

CREATE TRIGGER update_concept_nodes_updated_at
BEFORE UPDATE ON public.concept_nodes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. REFLECTION SYSTEM
-- ============================================================================

-- Reflection prompts
CREATE TABLE IF NOT EXISTS public.reflection_prompts (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT,
  estimated_time INTEGER,
  question_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_prompts_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL
);

CREATE INDEX idx_reflection_prompts_topic ON public.reflection_prompts(topic);
CREATE INDEX idx_reflection_prompts_difficulty ON public.reflection_prompts(difficulty);
CREATE INDEX idx_reflection_prompts_class_id ON public.reflection_prompts(class_id);

CREATE TRIGGER update_reflection_prompts_updated_at
BEFORE UPDATE ON public.reflection_prompts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- User reflections
CREATE TABLE IF NOT EXISTS public.user_reflections (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prompt_id UUID NOT NULL,
  activity_id UUID,
  content TEXT NOT NULL,
  word_count INTEGER,
  is_completed BOOLEAN DEFAULT FALSE,
  topic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_reflections_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reflections_prompt FOREIGN KEY (prompt_id) REFERENCES public.reflection_prompts(id) ON DELETE CASCADE,
  CONSTRAINT fk_reflections_activity FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE SET NULL,
  CONSTRAINT unique_user_prompt_reflection UNIQUE (user_id, prompt_id)
);

CREATE INDEX idx_user_reflections_user_id ON public.user_reflections(user_id);
CREATE INDEX idx_user_reflections_prompt_id ON public.user_reflections(prompt_id);
CREATE INDEX idx_user_reflections_completed ON public.user_reflections(is_completed);

CREATE TRIGGER update_user_reflections_updated_at
BEFORE UPDATE ON public.user_reflections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. TASK TRACKING SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_task_progress (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id VARCHAR(100) NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  task_type VARCHAR(50),
  is_completed BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 100,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_task_progress_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_task UNIQUE (user_id, task_id)
);

CREATE INDEX idx_user_task_progress_user_id ON public.user_task_progress(user_id);
CREATE INDEX idx_user_task_progress_completed ON public.user_task_progress(is_completed);
CREATE INDEX idx_user_task_progress_task_type ON public.user_task_progress(task_type);

CREATE TRIGGER update_user_task_progress_updated_at
BEFORE UPDATE ON public.user_task_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. ASSIGNMENT ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assignment_analytics (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL UNIQUE,
  total_submissions INTEGER DEFAULT 0,
  submissions_graded INTEGER DEFAULT 0,
  average_score NUMERIC(5, 2),
  highest_score INTEGER,
  lowest_score INTEGER,
  completion_rate NUMERIC(5, 2),
  on_time_submissions INTEGER DEFAULT 0,
  late_submissions INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_assignment_analytics_assignment FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE
);

CREATE INDEX idx_assignment_analytics_assignment_id ON public.assignment_analytics(assignment_id);

-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ADD COLUMN role TEXT DEFAULT 'student';
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FORUM POLICIES (allow safe public reads and authenticated writes)
-- ============================================================================

-- Allow anyone to read forum topics
CREATE POLICY "Public can read forum topics"
  ON public.forum_topics
  FOR SELECT
  USING (true);

-- Allow authenticated users to create forum topics where they are the creator
CREATE POLICY "Authenticated can create forum topics"
  ON public.forum_topics
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Allow topic owner to update their topic
CREATE POLICY "Topic owner can update topic"
  ON public.forum_topics
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

create policy "Allow uploads for authenticated users" on storage.objects
for all
using (auth.role() = 'authenticated');

-- ============================================================================
-- STORAGE POLICIES FOR ACTIVITIES BUCKET
-- ============================================================================

-- Instructors can upload files to activities bucket
CREATE POLICY "Instructors can upload activity files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'activities' 
    AND auth.role() = 'authenticated'
    AND (
      SELECT role FROM public.user_profiles 
      WHERE id = auth.uid()
    ) = 'instructor'
  );

-- Instructors can update their own activity files
CREATE POLICY "Instructors can update activity files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'activities' 
    AND auth.role() = 'authenticated'
    AND (
      SELECT role FROM public.user_profiles 
      WHERE id = auth.uid()
    ) = 'instructor'
  );

-- Instructors can delete their own activity files
CREATE POLICY "Instructors can delete activity files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'activities' 
    AND auth.role() = 'authenticated'
    AND (
      SELECT role FROM public.user_profiles 
      WHERE id = auth.uid()
    ) = 'instructor'
  );

-- Anyone can read activity files (if they're published)
CREATE POLICY "Public can read activity files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'activities');

-- ============================================================================
-- STORAGE POLICIES FOR IMAGES BUCKET
-- ============================================================================

-- Instructors can upload images
CREATE POLICY "Instructors can upload images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
    AND (
      SELECT role FROM public.user_profiles 
      WHERE id = auth.uid()
    ) = 'instructor'
  );

-- Instructors can update their own images
CREATE POLICY "Instructors can update images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
    AND (
      SELECT role FROM public.user_profiles 
      WHERE id = auth.uid()
    ) = 'instructor'
  );

-- Instructors can delete their own images
CREATE POLICY "Instructors can delete images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
    AND (
      SELECT role FROM public.user_profiles 
      WHERE id = auth.uid()
    ) = 'instructor'
  );

-- Class members can read images
CREATE POLICY "Class members can read images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
  );

-- Allow topic owner to delete their topic
CREATE POLICY "Topic owner can delete topic"
  ON public.forum_topics
  FOR DELETE
  USING (auth.uid() = created_by);

-- Allow anyone to read posts (so threads can be viewed)
CREATE POLICY "Public can read forum posts"
  ON public.forum_posts
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert posts where they are the author
CREATE POLICY "Authenticated can create forum posts"
  ON public.forum_posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Allow post author to update their posts
CREATE POLICY "Post author can update post"
  ON public.forum_posts
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Allow post author to delete their posts
CREATE POLICY "Post author can delete post"
  ON public.forum_posts
  FOR DELETE
  USING (auth.uid() = author_id);

-- Allow anyone to read forum replies
CREATE POLICY "Public can read forum replies"
  ON public.forum_replies
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert replies
CREATE POLICY "Authenticated can create forum replies"
  ON public.forum_replies
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Allow reply author to update/delete their replies
CREATE POLICY "Reply author can update reply"
  ON public.forum_replies
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Reply author can delete reply"
  ON public.forum_replies
  FOR DELETE
  USING (auth.uid() = author_id);

ALTER TABLE public.concept_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_quiz_responses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Instructors can view student profiles in their classes
CREATE POLICY "Instructors can view class student profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON ce.class_id = c.id
      WHERE ce.user_id = auth.uid()
      AND ce.role = 'instructor'
      AND c.id IN (
        SELECT class_id FROM public.class_enrollments
        WHERE user_id = user_profiles.id
      )
    )
  );

-- ============================================================================
-- CLASSES POLICIES
-- ============================================================================

-- Anyone can view active classes
CREATE POLICY "Anyone can view active classes"
  ON public.classes
  FOR SELECT
  USING (status = 'active');

-- Instructors can view all their classes
CREATE POLICY "Instructors can view own classes"
  ON public.classes
  FOR SELECT
  USING (auth.uid() = instructor_id);

-- Only instructors can create classes
CREATE POLICY "Only authenticated users can create classes"
  ON public.classes
  FOR INSERT
  WITH CHECK (auth.uid() = instructor_id);

-- Only class instructor can update class
CREATE POLICY "Only instructor can update class"
  ON public.classes
  FOR UPDATE
  USING (auth.uid() = instructor_id)
  WITH CHECK (auth.uid() = instructor_id);

-- ============================================================================
-- CLASS ENROLLMENTS POLICIES
-- ============================================================================

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
  ON public.class_enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Instructors can view enrollments in their classes
CREATE POLICY "Instructors can view class enrollments"
  ON public.class_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND instructor_id = auth.uid()
    )
  );

-- Users can join classes
CREATE POLICY "Users can enroll in classes"
  ON public.class_enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ASSIGNMENTS POLICIES
-- ============================================================================

-- Enrolled students and instructors can view assignments
CREATE POLICY "Class members can view assignments"
  ON public.assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_id = assignments.class_id AND user_id = auth.uid()
    )
  );

-- Only instructors can create assignments
CREATE POLICY "Instructors can create assignments"
  ON public.assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND instructor_id = auth.uid()
    )
  );

-- Only instructors can update assignments
CREATE POLICY "Instructors can update assignments"
  ON public.assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND instructor_id = auth.uid()
    )
  );

-- ============================================================================
-- CLASS RESOURCES POLICIES
-- ============================================================================

-- Class members can view class resources
CREATE POLICY "Class members can view class resources"
  ON public.class_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_id = class_resources.class_id AND user_id = auth.uid()
    )
  );

-- Only instructors can upload resources
CREATE POLICY "Instructors can upload resources"
  ON public.class_resources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND instructor_id = auth.uid()
    )
  );

-- Only instructors can update resources
CREATE POLICY "Instructors can update resources"
  ON public.class_resources
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND instructor_id = auth.uid()
    )
  );

-- Only instructors can delete resources
CREATE POLICY "Instructors can delete resources"
  ON public.class_resources
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND instructor_id = auth.uid()
    )
  );

-- ============================================================================
-- ACTIVITIES POLICIES
-- ============================================================================

-- Class members can view published activities
CREATE POLICY "Class members can view published activities"
  ON public.activities
  FOR SELECT
  USING (
    is_published = TRUE AND
    EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_id = activities.class_id AND user_id = auth.uid()
    )
  );

-- Instructors can view their own activities in their classes
CREATE POLICY "Instructors can view own activities"
  ON public.activities
  FOR SELECT
  USING (auth.uid() = instructor_id);

-- Only instructors can create activities
CREATE POLICY "Instructors can create activities"
  ON public.activities
  FOR INSERT
  WITH CHECK (
    auth.uid() = instructor_id AND
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND instructor_id = auth.uid()
    )
  );

-- Only instructors can update their own activities
CREATE POLICY "Instructors can update own activities"
  ON public.activities
  FOR UPDATE
  USING (auth.uid() = instructor_id)
  WITH CHECK (auth.uid() = instructor_id);

-- Only instructors can delete their own activities
CREATE POLICY "Instructors can delete own activities"
  ON public.activities
  FOR DELETE
  USING (auth.uid() = instructor_id);

-- ============================================================================
-- ASSIGNMENT SUBMISSIONS POLICIES
-- ============================================================================

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
  ON public.assignment_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Instructors can view all submissions for their assignments
CREATE POLICY "Instructors can view class submissions"
  ON public.assignment_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.classes c ON a.class_id = c.id
      WHERE a.id = assignment_id AND c.instructor_id = auth.uid()
    )
  );

-- Students can submit assignments
CREATE POLICY "Students can create submissions"
  ON public.assignment_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Students can update their own submissions
CREATE POLICY "Students can update own submissions"
  ON public.assignment_submissions
  FOR UPDATE
  USING (auth.uid() = user_id AND status != 'graded')
  WITH CHECK (auth.uid() = user_id AND status != 'graded');

-- Instructors can grade submissions
CREATE POLICY "Instructors can grade submissions"
  ON public.assignment_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.classes c ON a.class_id = c.id
      WHERE a.id = assignment_id AND c.instructor_id = auth.uid()
    )
  );

-- ============================================================================
-- QUIZZES POLICIES
-- ============================================================================

-- Class members can view quizzes
CREATE POLICY "Class members can view quizzes"
  ON public.quizzes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_id = quizzes.class_id AND user_id = auth.uid()
    )
  );

-- Only instructors can create quizzes
CREATE POLICY "Instructors can create quizzes"
  ON public.quizzes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND instructor_id = auth.uid()
    )
  );

-- Only instructors can update quizzes
CREATE POLICY "Instructors can update quizzes"
  ON public.quizzes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_id AND instructor_id = auth.uid()
    )
  );

-- ============================================================================
-- QUIZ ATTEMPTS POLICIES
-- ============================================================================

-- Users can view their own attempts
CREATE POLICY "Users can view own quiz attempts"
  ON public.quiz_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Instructors can view attempts for their quizzes
CREATE POLICY "Instructors can view quiz attempts"
  ON public.quiz_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.classes c ON q.class_id = c.id
      WHERE q.id = quiz_id AND c.instructor_id = auth.uid()
    )
  );

-- Students can create quiz attempts
CREATE POLICY "Students can create quiz attempts"
  ON public.quiz_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own in-progress attempts
CREATE POLICY "Users can update own quiz attempts"
  ON public.quiz_attempts
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'in_progress');

-- ============================================================================
-- FORUM POSTS POLICIES
-- ============================================================================

-- Class members can view forum topics and posts
CREATE POLICY "Class members can view forum posts"
  ON public.forum_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_topics ft
      JOIN public.class_enrollments ce ON ft.class_id = ce.class_id
      WHERE ft.id = topic_id AND ce.user_id = auth.uid()
    )
  );

-- Class members can create posts
CREATE POLICY "Class members can create posts"
  ON public.forum_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.forum_topics ft
      JOIN public.class_enrollments ce ON ft.class_id = ce.class_id
      WHERE ft.id = topic_id AND ce.user_id = auth.uid()
    )
  );

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON public.forum_posts
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- ============================================================================
-- GAME SCORES POLICIES
-- ============================================================================

-- Users can view their own game scores
CREATE POLICY "Users can view own game scores"
  ON public.game_scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- Public can view leaderboard (aggregate scores by game)
CREATE POLICY "Anyone can view game leaderboard"
  ON public.game_leaderboard
  FOR SELECT
  USING (TRUE);

-- Authenticated users can create leaderboard entries
CREATE POLICY "Authenticated users can create leaderboard entries"
  ON public.game_leaderboard
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own leaderboard entries
CREATE POLICY "Users can update own leaderboard entries"
  ON public.game_leaderboard
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can create game scores
CREATE POLICY "Users can create game scores"
  ON public.game_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIVIA AND TIMELINE SCORE POLICIES
-- ============================================================================

-- Anyone can view trivia scores (public leaderboard)
CREATE POLICY "Anyone can view trivia scores"
  ON public.trivia_scores
  FOR SELECT
  USING (TRUE);

-- Authenticated users can create trivia scores
CREATE POLICY "Authenticated users can create trivia scores"
  ON public.trivia_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own trivia scores
CREATE POLICY "Users can view own trivia scores"
  ON public.trivia_scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can view timeline scores (public leaderboard)
CREATE POLICY "Anyone can view timeline scores"
  ON public.timeline_scores
  FOR SELECT
  USING (TRUE);

-- Authenticated users can create timeline scores
CREATE POLICY "Authenticated users can create timeline scores"
  ON public.timeline_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own timeline scores
CREATE POLICY "Users can view own timeline scores"
  ON public.timeline_scores
  FOR SELECT
  USING (auth.uid() = user_id);

  -- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR QUIZZES AND RELATED TABLES
-- Execute this in Supabase SQL Editor to enable quiz functionality
-- ============================================================================

-- ============================================================================
-- QUIZZES TABLE POLICIES
-- ============================================================================

-- Instructors can create quizzes
CREATE POLICY IF NOT EXISTS "Instructors can create quizzes"
  ON public.quizzes
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = quizzes.class_id
      AND classes.instructor_id = auth.uid()
    )
  );

-- Instructors can view their own quizzes
CREATE POLICY IF NOT EXISTS "Instructors can view own quizzes"
  ON public.quizzes
  FOR SELECT
  USING (
    auth.uid() = created_by
  );

-- Students can view quizzes in their classes
CREATE POLICY IF NOT EXISTS "Students can view class quizzes"
  ON public.quizzes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_enrollments.user_id = auth.uid()
      AND class_enrollments.class_id = quizzes.class_id
      AND quizzes.status = 'active'
    )
  );

-- Instructors can update their own quizzes (before students answer)
CREATE POLICY IF NOT EXISTS "Instructors can update own quizzes"
  ON public.quizzes
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Instructors can delete their own quizzes
CREATE POLICY IF NOT EXISTS "Instructors can delete own quizzes"
  ON public.quizzes
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = quizzes.class_id
      AND classes.instructor_id = auth.uid()
    )
  );

-- Instructors can view their own quizzes
-- Replaced above
  ON public.quizzes
  FOR SELECT
  USING (
    auth.uid() = created_by
  );

-- Students can view quizzes in their classes

CREATE POLICY "Students can view class quizzes"
  ON public.quizzes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_enrollments.user_id = auth.uid()
      AND class_enrollments.class_id = quizzes.class_id
      AND quizzes.status = 'active'
    )
  );

-- Instructors can update their own quizzes (before students answer)

CREATE POLICY "Instructors can update own quizzes"
  ON public.quizzes
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Instructors can delete their own quizzes

CREATE POLICY "Instructors can delete own quizzes"
  ON public.quizzes
  FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================================
-- QUIZ_QUESTIONS TABLE POLICIES
-- ============================================================================

-- Instructors can create questions in their quizzes
CREATE POLICY IF NOT EXISTS "Instructors can create quiz questions"
  ON public.quiz_questions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- Instructors can view questions in their quizzes
CREATE POLICY IF NOT EXISTS "Instructors can view quiz questions"
  ON public.quiz_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- Students can view questions in active quizzes they're taking
DROP POLICY IF EXISTS "Students can view quiz questions" ON public.quiz_questions;
CREATE POLICY "Students can view quiz questions"
  ON public.quiz_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      JOIN public.class_enrollments ON class_enrollments.class_id = quizzes.class_id
      WHERE quizzes.id = quiz_questions.quiz_id
      AND class_enrollments.user_id = auth.uid()
      AND quizzes.status = 'active'
    )
  );

-- Instructors can update questions in their quizzes
CREATE POLICY IF NOT EXISTS "Instructors can update quiz questions"
  ON public.quiz_questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- Instructors can delete questions in their quizzes
CREATE POLICY IF NOT EXISTS "Instructors can delete quiz questions"
  ON public.quiz_questions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- ============================================================================
-- QUIZ_OPTIONS TABLE POLICIES
-- ============================================================================

-- Instructors can create options in their quiz questions
CREATE POLICY IF NOT EXISTS "Instructors can create quiz options"
  ON public.quiz_options
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_questions
      JOIN public.quizzes ON quizzes.id = quiz_questions.quiz_id
      WHERE quiz_questions.id = quiz_options.question_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- Instructors can view options in their quiz questions
CREATE POLICY IF NOT EXISTS "Instructors can view quiz options"
  ON public.quiz_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions
      JOIN public.quizzes ON quizzes.id = quiz_questions.quiz_id
      WHERE quiz_questions.id = quiz_options.question_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- Students can view options in active quizzes they're taking
CREATE POLICY IF NOT EXISTS "Students can view quiz options"
  ON public.quiz_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions
      JOIN public.quizzes ON quizzes.id = quiz_questions.quiz_id
      JOIN public.class_enrollments ON class_enrollments.class_id = quizzes.class_id
      WHERE quiz_questions.id = quiz_options.question_id
      AND class_enrollments.user_id = auth.uid()
      AND quizzes.status = 'active'
    )
  );

-- Instructors can update options in their quiz questions
CREATE POLICY IF NOT EXISTS "Instructors can update quiz options"
  ON public.quiz_options
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions
      JOIN public.quizzes ON quizzes.id = quiz_questions.quiz_id
      WHERE quiz_questions.id = quiz_options.question_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- Instructors can delete options in their quiz questions
CREATE POLICY IF NOT EXISTS "Instructors can delete quiz options"
  ON public.quiz_options
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions
      JOIN public.quizzes ON quizzes.id = quiz_questions.quiz_id
      WHERE quiz_questions.id = quiz_options.question_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- ============================================================================
-- QUIZ_RESPONSES TABLE POLICIES (for storing student answers)
-- ============================================================================

-- Students can create their own quiz responses
CREATE POLICY IF NOT EXISTS "Students can create quiz responses"
  ON public.quiz_responses
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.quizzes
      JOIN public.class_enrollments ON class_enrollments.class_id = quizzes.class_id
      WHERE quizzes.id = quiz_responses.quiz_id
      AND class_enrollments.user_id = auth.uid()
      AND quizzes.status = 'active'
    )
  );

-- Students can view their own responses
CREATE POLICY IF NOT EXISTS "Students can view own responses"
  ON public.quiz_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Instructors can view responses to their quizzes
CREATE POLICY IF NOT EXISTS "Instructors can view quiz responses"
  ON public.quiz_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_responses.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- Students can update their own responses
CREATE POLICY IF NOT EXISTS "Students can update own responses"
  ON public.quiz_responses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- QUIZ_ATTEMPTS TABLE POLICIES (for tracking quiz attempts)
-- ============================================================================

-- Students can create their own quiz attempts
CREATE POLICY IF NOT EXISTS "Students can create quiz attempts"
  ON public.quiz_attempts
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.quizzes
      JOIN public.class_enrollments ON class_enrollments.class_id = quizzes.class_id
      WHERE quizzes.id = quiz_attempts.quiz_id
      AND class_enrollments.user_id = auth.uid()
      AND quizzes.status = 'active'
    )
  );

-- Students can view their own attempts
CREATE POLICY IF NOT EXISTS "Students can view own attempts"
  ON public.quiz_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Instructors can view attempts on their quizzes
CREATE POLICY IF NOT EXISTS "Instructors can view quiz attempts"
  ON public.quiz_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_attempts.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- Students can update their own attempts
CREATE POLICY IF NOT EXISTS "Students can update own attempts"
  ON public.quiz_attempts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- QUIZ_ANALYTICS TABLE POLICIES
-- ============================================================================

-- Instructors can view analytics for their quizzes
CREATE POLICY IF NOT EXISTS "Instructors can view quiz analytics"
  ON public.quiz_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_analytics.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- System can insert/update analytics (created by triggers)
CREATE POLICY IF NOT EXISTS "System can manage quiz analytics"
  ON public.quiz_analytics
  FOR ALL
  USING (TRUE);

-- ============================================================================
-- TOPICS TABLE POLICIES
-- ============================================================================

-- Instructors can create topics in their classes
CREATE POLICY topic_insert ON public.topics
    FOR INSERT
    WITH CHECK (
        (SELECT instructor_id FROM public.classes WHERE id = class_id) = auth.uid()
    );

-- Class members can view topics in their classes
CREATE POLICY topic_select ON public.topics
    FOR SELECT
    USING (
        class_id IN (
            SELECT class_id FROM public.class_enrollments WHERE user_id = auth.uid()
            UNION
            SELECT id FROM public.classes WHERE instructor_id = auth.uid()
        )
    );

-- Instructors can update topics in their classes
CREATE POLICY topic_update ON public.topics
    FOR UPDATE
    USING (
        (SELECT instructor_id FROM public.classes WHERE id = class_id) = auth.uid()
    )
    WITH CHECK (
        (SELECT instructor_id FROM public.classes WHERE id = class_id) = auth.uid()
    );

-- Instructors can delete topics from their classes
CREATE POLICY topic_delete ON public.topics
    FOR DELETE
    USING (
        (SELECT instructor_id FROM public.classes WHERE id = class_id) = auth.uid()
    );

-- ============================================================================
-- REFLECTION POLICIES
-- ============================================================================

-- Class members can view reflection prompts
CREATE POLICY "Class members can view reflection prompts"
  ON public.reflection_prompts
  FOR SELECT
  USING (
    class_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_id = reflection_prompts.class_id AND user_id = auth.uid()
    )
  );

-- Users can view their own reflections
CREATE POLICY "Users can view own reflections"
  ON public.user_reflections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create reflections
CREATE POLICY "Users can create reflections"
  ON public.user_reflections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reflections
CREATE POLICY "Users can update own reflections"
  ON public.user_reflections
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ACTIVITY SUBMISSIONS POLICIES
-- ============================================================================

-- Students can view their own activity submissions
CREATE POLICY "Students can view own activity submissions"
  ON public.activity_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Instructors can view all submissions for their activities
CREATE POLICY "Instructors can view activity submissions"
  ON public.activity_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id AND a.instructor_id = auth.uid()
    )
  );

-- Students can create activity submissions
CREATE POLICY "Students can create activity submissions"
  ON public.activity_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Students can update their own submissions
CREATE POLICY "Students can update own activity submissions"
  ON public.activity_submissions
  FOR UPDATE
  USING (auth.uid() = user_id AND status != 'graded')
  WITH CHECK (auth.uid() = user_id AND status != 'graded');

-- Instructors can grade submissions
CREATE POLICY "Instructors can grade activity submissions"
  ON public.activity_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id AND a.instructor_id = auth.uid()
    )
  );

-- ============================================================================
-- ACTIVITY QUIZ POLICIES
-- ============================================================================

-- Class members can view activity quiz questions for published activities
CREATE POLICY "Class members can view activity quiz questions"
  ON public.activity_quiz_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      JOIN public.class_enrollments ce ON a.class_id = ce.class_id
      WHERE a.id = activity_id AND ce.user_id = auth.uid() AND a.is_published = TRUE AND a.activity_type = 'quiz'
    )
  );

-- Instructors can create quiz questions in their activities
CREATE POLICY "Instructors can create activity quiz questions"
  ON public.activity_quiz_questions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id AND a.instructor_id = auth.uid()
    )
  );

-- Instructors can update their quiz questions
CREATE POLICY "Instructors can update activity quiz questions"
  ON public.activity_quiz_questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_id AND a.instructor_id = auth.uid()
    )
  );

-- Activity quiz responses viewable by submission owner and instructor
CREATE POLICY "Users can view own quiz responses"
  ON public.activity_quiz_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activity_submissions asub
      WHERE asub.id = submission_id AND asub.user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can view quiz responses"
  ON public.activity_quiz_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activity_submissions asub
      JOIN public.activities a ON asub.activity_id = a.id
      WHERE asub.id = submission_id AND a.instructor_id = auth.uid()
    )
  );

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- 
-- UNIFIED ACTIVITIES SYSTEM IMPROVEMENTS:
--
-- 1. ENHANCED ACTIVITIES TABLE:
--    - Added: max_attempts, submission_type, allow_late_submission
--    - Added: show_grading_criteria, allow_peer_review, require_submission
--    - Single source of truth for all activity types (assignment/quiz/reflection/discussion)
--
-- 2. NEW UNIFIED SUBMISSION SYSTEM:
--    - Created: activity_submissions table (replaces assignment_submissions + quiz_attempts)
--    - Features: attempt_number, grade_letter, consolidated status tracking
--    - Tracks all submission types: file, text, quiz, reflection
--    - New RLS policies for unified submission access control
--
-- 3. ACTIVITY-BASED QUIZ SYSTEM:
--    - Created: activity_quiz_questions (replaces standalone quiz_questions for activities)
--    - Created: activity_quiz_options (replaces standalone quiz_options)
--    - Created: activity_quiz_responses (tracks quiz answers within submissions)
--    - Backwards compatible: legacy quiz_questions/options remain for standalone quizzes
--
-- 4. UPDATED REFERENCES:
--    - assignment_submissions: Added activity_id for backward compatibility (DEPRECATED)
--    - quiz_attempts: Added activity_id for backward compatibility (DEPRECATED)
--    - user_reflections: Added activity_id to link reflections to activities
--
-- 5. MIGRATION PATH:
--    Step 1: All new submissions → use activity_submissions table
--    Step 2: Migrate old assignment_submissions data → activity_submissions with activity_id
--    Step 3: Migrate quiz attempts data → activity_submissions with activity_type='quiz'
--    Step 4: Archive old tables (keep for historical data if needed)
--
-- 6. REMOVED DUPLICATE TABLES:
--    - quiz_questions (legacy - replaced by activity_quiz_questions for activities)
--    - quiz_options (legacy - replaced by activity_quiz_options for activities)
--    - quiz_responses (legacy - replaced by activity_quiz_responses for activities)
--
-- 7. PREVIOUS SCHEMA STANDARDIZATIONS REMAIN:
--    - All primary keys use UUID
--    - All timestamps use TIMESTAMP WITH TIME ZONE
--    - Comprehensive RLS policies for data protection
--    - Class-based access control for students/instructors
--    - User isolation for personal data (profiles, scores, submissions)
--
-- ============================================================================