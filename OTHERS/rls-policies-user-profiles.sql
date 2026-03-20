-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR USER PROFILES
-- Execute this in Supabase SQL Editor to fix the 403 RLS permission errors
-- ============================================================================

-- Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Instructors can view class student profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;

-- Users can insert their own profile during signup
CREATE POLICY "Users can create own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

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

-- Instructors can update student profiles (for grading, notes, etc.)
CREATE POLICY "Instructors can update class student profiles"
  ON public.user_profiles
  FOR UPDATE
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

-- Admins can view all profiles (if you have an is_admin flag)
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );
