import { supabase } from './supabase-auth.js';

/**
 * Fetch all activities for a user's enrolled classes
 * @param {Object} options - Filter options
 * @param {string} options.userId - User ID (auto-fetched if not provided)
 * @param {string} options.classId - Filter by specific class
 * @param {string} options.activityType - Filter by activity type (assignment/quiz/reflection/discussion)
 * @param {boolean} options.publishedOnly - Only fetch published activities (default: true)
 * @returns {Promise<Array>} Array of activities with submission info
 */
export async function fetchActivities(options = {}) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user && !options.userId) {
      throw new Error('User not authenticated');
    }

    const userId = options.userId || user.id;

    // Get user's enrolled classes
    const { data: enrollments, error: enrollErr } = await supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('user_id', userId);

    if (enrollErr) throw enrollErr;

    let classIds = enrollments?.map(e => e.class_id) || [];

    // If specific class requested, filter to that
    if (options.classId) {
      classIds = classIds.filter(id => id === options.classId);
    }

    if (classIds.length === 0) {
      return [];
    }

    // Fetch activities
    let query = supabase
      .from('activities')
      .select(`
        id,
        title,
        description,
        prompt,
        activity_type,
        due_date,
        points,
        time_limit,
        min_words,
        max_attempts,
        submission_type,
        class_id,
        topic_id,
        is_published,
        created_at,
        classes(id, class_name),
        topics(id, title)
      `)
      .in('class_id', classIds)
      .order('due_date', { ascending: true });

    // Filter by published status
    if (options.publishedOnly !== false) {
      query = query.eq('is_published', true);
    }

    // Filter by activity type
    if (options.activityType) {
      query = query.eq('activity_type', options.activityType);
    }

    const { data: activities, error: activErr } = await query;
    if (activErr) throw activErr;

    // Fetch submissions for this user
    const { data: submissions, error: subErr } = await supabase
      .from('activity_submissions')
      .select('activity_id, status, score, grade_letter, attempt_number, submitted_at, graded_at')
      .eq('user_id', userId);

    if (subErr) throw subErr;

    // Create submission map by activity_id (get latest attempt)
    const submissionMap = {};
    submissions?.forEach(s => {
      if (!submissionMap[s.activity_id] || s.attempt_number > submissionMap[s.activity_id].attempt_number) {
        submissionMap[s.activity_id] = s;
      }
    });

    // Attach submission info to activities
    return activities.map(a => ({
      ...a,
      submission: submissionMap[a.id] || null
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
}

/**
 * Fetch a single activity by ID
 * @param {string} activityId - Activity ID
 * @returns {Promise<Object>} Activity object with submission info
 */
export async function fetchActivityById(activityId) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Fetch activity
    const { data: activity, error: actErr } = await supabase
      .from('activities')
      .select(`
        id,
        title,
        description,
        prompt,
        activity_type,
        due_date,
        points,
        time_limit,
        min_words,
        max_attempts,
        submission_type,
        class_id,
        topic_id,
        instructor_id,
        is_published,
        allow_late_submission,
        show_grading_criteria,
        file_url,
        created_at,
        classes(id, class_name),
        topics(id, title)
      `)
      .eq('id', activityId)
      .single();

    if (actErr) throw actErr;

    // Fetch submission
    const { data: submission, error: subErr } = await supabase
      .from('activity_submissions')
      .select('*')
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .order('attempt_number', { ascending: false })
      .maybeSingle();

    if (subErr) throw subErr;

    return {
      ...activity,
      submission: submission || null
    };
  } catch (error) {
    console.error('Error fetching activity:', error);
    throw error;
  }
}

/**
 * Submit an activity (file, text, or quiz)
 * @param {Object} submission - Submission data
 * @param {string} submission.activityId - Activity ID
 * @param {string} submission.userId - User ID (auto-fetched if not provided)
 * @param {string} submission.submissionText - Text content (optional)
 * @param {string} submission.submissionUrls - JSON string of URLs (optional)
 * @param {number} submission.attemptNumber - Attempt number (default: 1)
 * @returns {Promise<Object>} Created submission
 */
export async function submitActivity(submission) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const payload = {
      activity_id: submission.activityId,
      user_id: submission.userId || user.id,
      submission_text: submission.submissionText || null,
      submission_urls: submission.submissionUrls || null,
      status: submission.status || 'submitted',
      attempt_number: submission.attemptNumber || 1,
      submitted_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('activity_submissions')
      .upsert(payload, { onConflict: ['activity_id', 'user_id', 'attempt_number'] })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting activity:', error);
    throw error;
  }
}

/**
 * Get activity submission statistics
 * @param {string} activityId - Activity ID
 * @returns {Promise<Object>} Submission stats
 */
export async function getActivityStats(activityId) {
  try {
    const { data: submissions, error } = await supabase
      .from('activity_submissions')
      .select('status, score')
      .eq('activity_id', activityId);

    if (error) throw error;

    const stats = {
      total: submissions?.length || 0,
      submitted: 0,
      graded: 0,
      late: 0,
      draft: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0
    };

    if (submissions && submissions.length > 0) {
      let scoreSum = 0;
      let scoreCount = 0;

      submissions.forEach(s => {
        stats[s.status] = (stats[s.status] || 0) + 1;
        
        if (s.score !== null && s.score !== undefined) {
          scoreSum += s.score;
          scoreCount++;
          stats.highestScore = Math.max(stats.highestScore, s.score);
          if (stats.lowestScore === 0) stats.lowestScore = s.score;
          else stats.lowestScore = Math.min(stats.lowestScore, s.score);
        }
      });

      if (scoreCount > 0) {
        stats.averageScore = (scoreSum / scoreCount).toFixed(2);
      }
    }

    return stats;
  } catch (error) {
    console.error('Error getting activity stats:', error);
    throw error;
  }
}

/**
 * Fetch quiz questions for an activity
 * @param {string} activityId - Activity ID
 * @returns {Promise<Array>} Quiz questions with options
 */
export async function fetchQuizQuestions(activityId) {
  try {
    const { data, error } = await supabase
      .from('activity_quiz_questions')
      .select(`
        id,
        question_text,
        question_type,
        question_order,
        points,
        activity_quiz_options(
          id,
          option_text,
          option_order,
          is_correct
        )
      `)
      .eq('activity_id', activityId)
      .order('question_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    throw error;
  }
}

/**
 * Save quiz response
 * @param {Object} response - Quiz response data
 * @param {string} response.submissionId - Submission ID
 * @param {string} response.questionId - Question ID
 * @param {string} response.selectedOptionId - Selected option ID (optional)
 * @param {string} response.responseText - Response text (optional)
 * @param {boolean} response.isCorrect - Is answer correct (optional)
 * @param {number} response.pointsEarned - Points earned (optional)
 * @returns {Promise<Object>} Created response
 */
export async function saveQuizResponse(response) {
  try {
    const { data, error } = await supabase
      .from('activity_quiz_responses')
      .insert({
        submission_id: response.submissionId,
        question_id: response.questionId,
        selected_option_id: response.selectedOptionId || null,
        response_text: response.responseText || null,
        is_correct: response.isCorrect || null,
        points_earned: response.pointsEarned || 0,
        answered_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving quiz response:', error);
    throw error;
  }
}

/**
 * Fetch user's activity submissions for a class
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} User's submissions in the class
 */
export async function fetchUserSubmissions(classId) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activity_submissions')
      .select(`
        id,
        activity_id,
        status,
        score,
        grade_letter,
        submitted_at,
        graded_at,
        activities(
          id,
          title,
          activity_type,
          points,
          class_id
        )
      `)
      .eq('user_id', user.id)
      .eq('activities.class_id', classId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    throw error;
  }
}

export default {
  fetchActivities,
  fetchActivityById,
  submitActivity,
  getActivityStats,
  fetchQuizQuestions,
  saveQuizResponse,
  fetchUserSubmissions
};
