-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR QUIZZES AND RELATED TABLES
-- Execute this in Supabase SQL Editor to enable quiz functionality
-- ============================================================================

-- ============================================================================
-- QUIZZES TABLE POLICIES
-- ============================================================================

-- Instructors can create quizzes
DROP POLICY IF EXISTS "Instructors can create quizzes" ON public.quizzes;
CREATE POLICY "Instructors can create quizzes"
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
DROP POLICY IF EXISTS "Instructors can view own quizzes" ON public.quizzes;
CREATE POLICY "Instructors can view own quizzes"
  ON public.quizzes
  FOR SELECT
  USING (
    auth.uid() = created_by
  );

-- Students can view quizzes in their classes
DROP POLICY IF EXISTS "Students can view class quizzes" ON public.quizzes;
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
DROP POLICY IF EXISTS "Instructors can update own quizzes" ON public.quizzes;
CREATE POLICY "Instructors can update own quizzes"
  ON public.quizzes
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Instructors can delete their own quizzes
DROP POLICY IF EXISTS "Instructors can delete own quizzes" ON public.quizzes;
CREATE POLICY "Instructors can delete own quizzes"
  ON public.quizzes
  FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================================
-- QUIZ_QUESTIONS TABLE POLICIES
-- ============================================================================

-- Instructors can create questions in their quizzes
DROP POLICY IF EXISTS "Instructors can create quiz questions" ON public.quiz_questions;
CREATE POLICY "Instructors can create quiz questions"
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
DROP POLICY IF EXISTS "Instructors can view quiz questions" ON public.quiz_questions;
CREATE POLICY "Instructors can view quiz questions"
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
DROP POLICY IF EXISTS "Instructors can update quiz questions" ON public.quiz_questions;
CREATE POLICY "Instructors can update quiz questions"
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
DROP POLICY IF EXISTS "Instructors can delete quiz questions" ON public.quiz_questions;
CREATE POLICY "Instructors can delete quiz questions"
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
DROP POLICY IF EXISTS "Instructors can create quiz options" ON public.quiz_options;
CREATE POLICY "Instructors can create quiz options"
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
DROP POLICY IF EXISTS "Instructors can view quiz options" ON public.quiz_options;
CREATE POLICY "Instructors can view quiz options"
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
DROP POLICY IF EXISTS "Students can view quiz options" ON public.quiz_options;
CREATE POLICY "Students can view quiz options"
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
DROP POLICY IF EXISTS "Instructors can update quiz options" ON public.quiz_options;
CREATE POLICY "Instructors can update quiz options"
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
DROP POLICY IF EXISTS "Instructors can delete quiz options" ON public.quiz_options;
CREATE POLICY "Instructors can delete quiz options"
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
-- QUIZ_RESPONSES TABLE POLICIES (answers to individual questions)
-- ============================================================================

-- Students can create their own quiz responses
DROP POLICY IF EXISTS "Students can create quiz responses" ON public.quiz_responses;
CREATE POLICY "Students can create quiz responses"
  ON public.quiz_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts
      WHERE quiz_attempts.id = quiz_responses.attempt_id
      AND quiz_attempts.user_id = auth.uid()
    )
  );

-- Students can view their own responses
DROP POLICY IF EXISTS "Students can view own responses" ON public.quiz_responses;
CREATE POLICY "Students can view own responses"
  ON public.quiz_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts
      WHERE quiz_attempts.id = quiz_responses.attempt_id
      AND quiz_attempts.user_id = auth.uid()
    )
  );

-- Instructors can view responses to their quizzes
DROP POLICY IF EXISTS "Instructors can view quiz responses" ON public.quiz_responses;
CREATE POLICY "Instructors can view quiz responses"
  ON public.quiz_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts
      JOIN public.quizzes ON quizzes.id = quiz_attempts.quiz_id
      WHERE quiz_attempts.id = quiz_responses.attempt_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- Students can update their own responses
DROP POLICY IF EXISTS "Students can update own responses" ON public.quiz_responses;
CREATE POLICY "Students can update own responses"
  ON public.quiz_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts
      WHERE quiz_attempts.id = quiz_responses.attempt_id
      AND quiz_attempts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts
      WHERE quiz_attempts.id = quiz_responses.attempt_id
      AND quiz_attempts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- QUIZ_ATTEMPTS TABLE POLICIES (for tracking quiz attempts)
-- ============================================================================

-- Students can create their own quiz attempts
DROP POLICY IF EXISTS "Students can create quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Students can create quiz attempts"
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
DROP POLICY IF EXISTS "Students can view own attempts" ON public.quiz_attempts;
CREATE POLICY "Students can view own attempts"
  ON public.quiz_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Instructors can view attempts on their quizzes
DROP POLICY IF EXISTS "Instructors can view quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Instructors can view quiz attempts"
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
DROP POLICY IF EXISTS "Students can update own attempts" ON public.quiz_attempts;
CREATE POLICY "Students can update own attempts"
  ON public.quiz_attempts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- QUIZ_ANALYTICS TABLE POLICIES
-- ============================================================================

-- Instructors can view analytics for their quizzes
DROP POLICY IF EXISTS "Instructors can view quiz analytics" ON public.quiz_analytics;
CREATE POLICY "Instructors can view quiz analytics"
  ON public.quiz_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_analytics.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- Allow authenticated users to insert analytics (usually via triggers)
DROP POLICY IF EXISTS "Authenticated can insert quiz analytics" ON public.quiz_analytics;
CREATE POLICY "Authenticated can insert quiz analytics"
  ON public.quiz_analytics
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow updates to analytics
DROP POLICY IF EXISTS "Allow update to quiz analytics" ON public.quiz_analytics;
CREATE POLICY "Allow update to quiz analytics"
  ON public.quiz_analytics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_analytics.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = quiz_analytics.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );
