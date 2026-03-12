import { supabase } from './supabase-auth.js';

/**
 * Fetch user profile information
 * @param {string} userId - User ID (auto-fetched if not provided)
 * @returns {Promise<Object>} User profile
 */
export async function fetchUserProfile(userId) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user && !userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId || user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateUserProfile(updates) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Get user's role (student/instructor/admin)
 * @param {string} userId - User ID (auto-fetched if not provided)
 * @returns {Promise<string>} User role
 */
export async function getUserRole(userId) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user && !userId) throw new Error('User not authenticated');

    const profile = await fetchUserProfile(userId || user.id);
    return profile?.role || 'student';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'student';
  }
}

/**
 * Get user's activity statistics
 * @returns {Promise<Object>} User stats (submissions, grades, etc.)
 */
export async function getUserStats() {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Get enrolled classes count
    const { count: classesCount } = await supabase
      .from('class_enrollments')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    // Get activities count
    const enrollments = await supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('user_id', user.id);

    const classIds = enrollments?.data?.map(e => e.class_id) || [];

    const { count: activitiesCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact' })
      .in('class_id', classIds)
      .eq('is_published', true);

    // Get submissions stats
    const { data: submissions } = await supabase
      .from('activity_submissions')
      .select('status, score')
      .eq('user_id', user.id);

    let submittedCount = 0;
    let gradedCount = 0;
    let averageScore = 0;

    if (submissions && submissions.length > 0) {
      submittedCount = submissions.filter(s => ['submitted', 'graded', 'late'].includes(s.status)).length;
      gradedCount = submissions.filter(s => s.status === 'graded').length;
      const scores = submissions.filter(s => s.score !== null).map(s => s.score);
      if (scores.length > 0) {
        averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
      }
    }

    return {
      enrolledClasses: classesCount || 0,
      totalActivities: activitiesCount || 0,
      totalSubmissions: submissions?.length || 0,
      submittedActivities: submittedCount,
      gradedActivities: gradedCount,
      averageScore: parseFloat(averageScore) || 0
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      enrolledClasses: 0,
      totalActivities: 0,
      totalSubmissions: 0,
      submittedActivities: 0,
      gradedActivities: 0,
      averageScore: 0
    };
  }
}

/**
 * Get user's recent activity (submissions, comments, etc.)
 * @param {number} limit - Number of recent items to fetch
 * @returns {Promise<Array>} Recent activities
 */
export async function getUserRecentActivity(limit = 10) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activity_submissions')
      .select(`
        id,
        submitted_at,
        status,
        score,
        activities(id, title, activity_type, class_id)
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
}

/**
 * Get users by role
 * @param {string} role - User role (student/instructor/admin)
 * @returns {Promise<Array>} Users with specified role
 */
export async function fetchUsersByRole(role) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, avatar_url, bio, role')
      .eq('role', role)
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
}

/**
 * Search for users by name or email
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Matching users
 */
export async function searchUsers(searchTerm) {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error('Search term must be at least 2 characters');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, avatar_url, role')
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

/**
 * Get user's grade distribution across classes
 * @returns {Promise<Object>} Grade stats per class
 */
export async function getUserGradeDistribution() {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Get enrolled classes
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select(`
        class_id,
        classes(id, class_name)
      `)
      .eq('user_id', user.id);

    const classMap = {};
    enrollments?.forEach(e => {
      classMap[e.class_id] = e.classes.class_name;
    });

    // Get submissions with grades
    const { data: submissions } = await supabase
      .from('activity_submissions')
      .select(`
        grade_letter,
        score,
        activities(class_id)
      `)
      .eq('user_id', user.id);

    const gradeStats = {};
    (enrollments || []).forEach(e => {
      gradeStats[e.class_id] = {
        className: classMap[e.class_id],
        grades: {},
        averageScore: 0,
        totalSubmissions: 0
      };
    });

    if (submissions && submissions.length > 0) {
      let classSubmissions = {};

      submissions.forEach(s => {
        const classId = s.activities.class_id;
        if (!classSubmissions[classId]) classSubmissions[classId] = [];
        classSubmissions[classId].push(s);

        if (s.grade_letter) {
          gradeStats[classId].grades[s.grade_letter] = (gradeStats[classId].grades[s.grade_letter] || 0) + 1;
        }
      });

      Object.keys(classSubmissions).forEach(classId => {
        const subs = classSubmissions[classId];
        const scores = subs.filter(s => s.score !== null).map(s => s.score);
        gradeStats[classId].totalSubmissions = subs.length;
        if (scores.length > 0) {
          gradeStats[classId].averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
        }
      });
    }

    return gradeStats;
  } catch (error) {
    console.error('Error fetching grade distribution:', error);
    throw error;
  }
}

/**
 * Upload user avatar
 * @param {File} file - Avatar image file
 * @returns {Promise<string>} Avatar URL
 */
export async function uploadAvatar(file) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    if (!file || !file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    // Update profile with avatar URL
    await updateUserProfile({ avatar_url: publicUrl });

    return publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Get user's GPA or overall performance score
 * @returns {Promise<Object>} GPA and performance metrics
 */
export async function getUserPerformance() {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { data: submissions } = await supabase
      .from('activity_submissions')
      .select('score, grade_letter')
      .eq('user_id', user.id)
      .not('grade_letter', 'is', null);

    const gradePoints = {
      'A': 4.0, 'A-': 3.7, 'A+': 4.0,
      'B': 3.0, 'B-': 2.7, 'B+': 3.3,
      'C': 2.0, 'C-': 1.7, 'C+': 2.3,
      'D': 1.0, 'D-': 0.7, 'D+': 1.3,
      'F': 0.0
    };

    let totalPoints = 0;
    let count = 0;
    let scoreSum = 0;
    let scoreCount = 0;

    (submissions || []).forEach(s => {
      if (s.grade_letter && gradePoints[s.grade_letter] !== undefined) {
        totalPoints += gradePoints[s.grade_letter];
        count++;
      }
      if (s.score !== null && s.score !== undefined) {
        scoreSum += s.score;
        scoreCount++;
      }
    });

    return {
      gpa: count > 0 ? (totalPoints / count).toFixed(2) : 0,
      averageScore: scoreCount > 0 ? (scoreSum / scoreCount).toFixed(2) : 0,
      gradedActivities: count,
      totalSubmissions: submissions?.length || 0
    };
  } catch (error) {
    console.error('Error calculating performance:', error);
    return {
      gpa: 0,
      averageScore: 0,
      gradedActivities: 0,
      totalSubmissions: 0
    };
  }
}

export default {
  fetchUserProfile,
  updateUserProfile,
  getUserRole,
  getUserStats,
  getUserRecentActivity,
  fetchUsersByRole,
  searchUsers,
  getUserGradeDistribution,
  uploadAvatar,
  getUserPerformance
};
