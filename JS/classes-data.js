// Module to fetch classes from Supabase - supports both legacy callback pattern and modern async
import { supabase } from './supabase-auth.js';

/**
 * LEGACY: Fetch paginated public classes with optional filtering
 * Kept for backward compatibility. Use fetchClasses() for new code.
 */
async function populateClasses(params, cb) {
  const q = (params && params.q) ? params.q.trim() : '';
  const page = (params && params.page) ? parseInt(params.page, 10) : 1;
  const limit = (params && params.limit) ? parseInt(params.limit, 10) : 12;
  const from = (page - 1) * limit;
  const instructor = params && params.instructor ? params.instructor : null;
  const sort = params && params.sort ? params.sort : 'created';

  try {
    let builder = supabase.from('classes').select('id,class_name,description,class_code,instructor_id,status,student_count,created_at')
      .range(from, from + limit - 1);

    if (q) {
      builder = builder.or(`class_name.ilike.%${q}%,class_code.ilike.%${q}%`);
    }

    if (instructor) builder = builder.eq('instructor_id', instructor);

    if (sort === 'name') builder = builder.order('class_name', { ascending: true });
    else if (sort === 'popularity') builder = builder.order('student_count', { ascending: false });
    else builder = builder.order('created_at', { ascending: false });

    const { data, error } = await builder;
    if (error) {
      console.error('populateClasses error', error);
      if (typeof cb === 'function') cb([], page);
      return [];
    }

    const items = (data || []).map(d => ({
      id: d.id,
      title: d.class_name,
      description: d.description,
      class_code: d.class_code,
      instructor: d.instructor_id,
      students: d.student_count,
      status: d.status,
      created_at: d.created_at
    }));

    if (typeof cb === 'function') cb(items, page);
    return items;
  } catch (e) {
    console.error(e);
    if (typeof cb === 'function') cb([], page);
    return [];
  }
}

/**
 * Fetch all available classes for browsing or enrollment
 * @param {Object} options - Filter options
 * @param {string} options.searchTerm - Search by class name or description
 * @param {string} options.topicId - Filter by topic
 * @param {boolean} options.enrolledOnly - Only fetch user's enrolled classes
 * @param {string} options.instructorId - Filter by instructor
 * @returns {Promise<Array>} Array of classes
 */
export async function fetchClasses(options = {}) {
  try {
    let query = supabase.from('classes').select(`
      id,
      class_name,
      description,
      code,
      instructor_id,
      topic_id,
      max_students,
      is_open_enrollment,
      is_published,
      created_at,
      user_profiles(id, full_name, avatar_url),
      topics(id, title)
    `);

    // Filter by published status
    query = query.eq('is_published', true);

    // If enrolled only, get user's classes
    if (options.enrolledOnly) {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { data: enrollments, error: enrollErr } = await supabase
        .from('class_enrollments')
        .select('class_id')
        .eq('user_id', user.id);

      if (enrollErr) throw enrollErr;

      const classIds = enrollments?.map(e => e.class_id) || [];
      if (classIds.length === 0) return [];

      query = query.in('id', classIds);
    }

    // Filter by instructor
    if (options.instructorId) {
      query = query.eq('instructor_id', options.instructorId);
    }

    // Filter by topic
    if (options.topicId) {
      query = query.eq('topic_id', options.topicId);
    }

    // Search by name or description
    if (options.searchTerm) {
      query = query.or(`class_name.ilike.%${options.searchTerm}%,description.ilike.%${options.searchTerm}%`);
    }

    const { data, error } = await query.order('class_name', { ascending: true });
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
}

/**
 * Fetch a single class with all details
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} Class with instructor, topics, and stats
 */
export async function fetchClassDetail(classId) {
  try {
    const id = classId || new URLSearchParams(location.search).get('id');
    if (!id) throw new Error('Missing class ID');

    const { data: cls, error: e1 } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    if (e1) throw e1;

    const [
      { data: instructor },
      { data: topics },
      { data: recentActivities },
      { count: activitiesCount },
      { count: studentsCount }
    ] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id,full_name,avatar_url,bio')
        .eq('id', cls.instructor_id)
        .maybeSingle(),
      supabase
        .from('topics')
        .select('id,title,description,display_order')
        .eq('class_id', id)
        .order('display_order', { ascending: true }),
      supabase
        .from('activities')
        .select('id,title,activity_type,due_date,created_at')
        .eq('class_id', id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('activities')
        .select('id', { count: 'exact' })
        .eq('class_id', id)
        .eq('is_published', true),
      supabase
        .from('class_enrollments')
        .select('id', { count: 'exact' })
        .eq('class_id', id)
    ]);

    return {
      class: cls,
      instructor: instructor || null,
      topics: topics || [],
      recentActivities: recentActivities || [],
      counts: {
        activities: activitiesCount || 0,
        students: studentsCount || cls.student_count || 0,
        topics: (topics && topics.length) || 0
      }
    };
  } catch (error) {
    console.error('Error fetching class detail:', error);
    throw error;
  }
}

/**
 * Enroll user in a class
 * @param {string} classId - Class ID
 * @param {string} userId - User ID (auto-fetched if not provided)
 * @returns {Promise<Object>} Enrollment record
 */
export async function enrollInClass(classId, userId) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user && !userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('class_enrollments')
      .insert({
        class_id: classId,
        user_id: userId || user.id,
        enrolled_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error enrolling in class:', error);
    throw error;
  }
}

/**
 * Unenroll user from a class
 * @param {string} classId - Class ID
 * @param {string} userId - User ID (auto-fetched if not provided)
 * @returns {Promise<boolean>} Success status
 */
export async function unenrollFromClass(classId, userId) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user && !userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('class_enrollments')
      .delete()
      .eq('class_id', classId)
      .eq('user_id', userId || user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unenrolling from class:', error);
    throw error;
  }
}

/**
 * Get user's enrolled classes
 * @returns {Promise<Array>} User's enrolled classes
 */
export async function fetchUserEnrolledClasses() {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('class_enrollments')
      .select(`
        class_id,
        enrolled_at,
        classes(
          id,
          class_name,
          description,
          code,
          is_published,
          user_profiles(id, full_name, avatar_url)
        )
      `)
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(e => ({
      ...e.classes,
      enrolledAt: e.enrolled_at
    }));
  } catch (error) {
    console.error('Error fetching enrolled classes:', error);
    throw error;
  }
}

/**
 * Get user's teaching classes (for instructors)
 * @returns {Promise<Array>} User's teaching classes
 */
export async function fetchUserTeachingClasses() {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        class_name,
        description,
        code,
        max_students,
        is_published,
        created_at
      `)
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get enrollment count for each class
    const classesWithStats = await Promise.all(
      (data || []).map(async (cls) => {
        const { count } = await supabase
          .from('class_enrollments')
          .select('id', { count: 'exact' })
          .eq('class_id', cls.id);

        const { count: actCount } = await supabase
          .from('activities')
          .select('id', { count: 'exact' })
          .eq('class_id', cls.id)
          .eq('is_published', true);

        return {
          ...cls,
          enrolledCount: count || 0,
          activityCount: actCount || 0
        };
      })
    );

    return classesWithStats;
  } catch (error) {
    console.error('Error fetching teaching classes:', error);
    throw error;
  }
}

/**
 * Check if user is enrolled in a class
 * @param {string} classId - Class ID
 * @param {string} userId - User ID (auto-fetched if not provided)
 * @returns {Promise<boolean>} Is enrolled
 */
export async function isUserEnrolled(classId, userId) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user && !userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('user_id', userId || user.id)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return false;
  }
}

/**
 * Get topics for a class
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} Topics in the class
 */
export async function fetchClassTopics(classId) {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('class_id', classId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching class topics:', error);
    throw error;
  }
}

// expose for legacy code
window.populateClasses = populateClasses;
export default populateClasses;
