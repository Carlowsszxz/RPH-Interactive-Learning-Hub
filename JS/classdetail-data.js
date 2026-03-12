import { supabase } from './supabase-auth.js';

export async function fetchClassDetail(classId){
  const id = classId || new URLSearchParams(location.search).get('id');
  if (!id) return { error: 'missing-id' };

  try {
    const { data: cls, error: e1 } = await supabase.from('classes').select('*').eq('id', id).single();
    if (e1) return { error: e1 };

    const [{ data: instructor }, { data: topics }, { data: recentActivities, error: actErr }, { count: activitiesCount }, { count: studentsCount }, { data: resources }] = await Promise.all([
      supabase.from('user_profiles').select('id,full_name,avatar_url,bio').eq('id', cls.instructor_id).maybeSingle(),
      supabase.from('topics').select('id,title,description,content,display_order').eq('class_id', id).order('display_order', { ascending: true }),
      supabase.from('activities').select('id,title,activity_type,due_date,created_at').eq('class_id', id).eq('is_published', true).order('created_at',{ascending:false}).limit(5),
      supabase.from('activities').select('id', { count: 'exact' }).eq('class_id', id).eq('is_published', true),
      supabase.from('class_enrollments').select('id', { count: 'exact' }).eq('class_id', id),
      supabase.from('class_resources').select('id,topic_id,title,description,resource_url,resource_type,created_at').eq('class_id', id).order('created_at', { ascending: false }),
    ]);
    
    // Organize resources by topic_id
    const resourcesByTopic = {};
    if (resources) {
      resources.forEach(res => {
        const topicId = res.topic_id || 'uncategorized';
        if (!resourcesByTopic[topicId]) resourcesByTopic[topicId] = [];
        resourcesByTopic[topicId].push(res);
      });
    }
    
    // Attach resources to topics
    if (topics) {
      topics.forEach(topic => {
        topic.resources = resourcesByTopic[topic.id] || [];
      });
    }

    return {
      class: cls,
      instructor: instructor || null,
      topics: topics || [],
      resources: resources || [],
      resourcesByTopic: resourcesByTopic,
      recentActivities: recentActivities || [],
      counts: {
        activities: activitiesCount || 0,
        students: studentsCount || cls.student_count || 0,
        topics: (topics && topics.length) || 0
      }
    };
  } catch (err) {
    return { error: err };
  }
}

export default fetchClassDetail;
