import { supabase } from './supabase-auth.js';

function fmtDate(d){ if (!d) return 'TBD'; return new Date(d).toLocaleString(); }
function getActivityIcon(type) {
  const icons = { 'assignment': '📝', 'quiz': '📋', 'reflection': '💭', 'discussion': '💬' };
  return icons[type] || '📌';
}
function getActivityTypeLabel(type) {
  const labels = { 'assignment': 'Assignment', 'quiz': 'Quiz', 'reflection': 'Reflection', 'discussion': 'Discussion' };
  return labels[type] || type;
}

function getSubjectIcon(category) {
  const icons = {
    'math': 'calculator',
    'science': 'flask',
    'language': 'book-open',
    'humanities': 'library',
    'default': 'book'
  };
  return icons[category] || icons['default'];
}

function escapeHTML(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', async ()=>{
  try{
    const ures = await supabase.auth.getUser();
    const user = ures?.data?.user || ures?.user;
    if (!user){ document.getElementById('subMsg').textContent = 'Sign in to manage your classes.'; return; }

    // Fetch classes taught by this instructor
    const { data: classes } = await supabase.from('classes').select('*,class_enrollments(count)').eq('instructor_id', user.id).order('created_at',{ascending:false});
    const cls = classes || [];
    document.getElementById('statClasses').textContent = cls.length;

    // Fetch total student count
    let totalStudents = 0;
    if (cls.length) {
      const classIds = cls.map(c => c.id);
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('id')
        .in('class_id', classIds);
      totalStudents = enrollments?.length || 0;
    }
    document.getElementById('statStudents').textContent = totalStudents;

    // Render classes with modern card design
    const classesContainer = document.getElementById('instructorClasses');
    classesContainer.innerHTML = '';
    
    if (cls.length === 0) {
      classesContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #999;">No classes yet. <a href="/TEMPLATES/FrameClassManagement.html" style="color: #FF6B35; text-decoration: none;">Create your first class</a></div>';
    } else {
      cls.forEach(c => {
        const icon = getSubjectIcon(null);
        const card = document.createElement('a');
        card.className = 'home-class-card';
        card.href = `/TEMPLATES/FrameClassDetail.html?id=${encodeURIComponent(c.id)}`;
        card.innerHTML = `
          <div class="home-class-card-background"></div>
          <div class="home-class-card-overlay">
            <div class="home-class-card-icon">
              <i data-lucide="${icon}"></i>
            </div>
          </div>
          <div class="home-class-card-title">${escapeHTML(c.class_name || 'Untitled Class')}</div>
          <div class="home-class-card-footer">
            <span class="home-class-instructor">${c.class_enrollments?.[0]?.count || 0} students</span>
          </div>
        `;
        classesContainer.appendChild(card);
      });
      
      // Initialize lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    // Fetch unified activities for these classes
    const classIds = cls.map(x=>x.id).filter(Boolean);
    let activities = [];
    if (classIds.length){
      const { data: aData } = await supabase.from('activities').select('*').in('class_id', classIds).eq('is_published', true).order('due_date',{ascending:true});
      activities = aData || [];
    }

    // Fetch all submissions for activities in these classes
    let submissions = [];
    if (activities.length){
      const activityIds = activities.map(a=>a.id);
      const { data: subs } = await supabase.from('activity_submissions').select('*').in('activity_id', activityIds).order('submitted_at',{ascending:false}).limit(50);
      submissions = subs || [];
    }

    // Enrich submissions with user profile data and activity info
    const enrichedSubmissions = await Promise.all(submissions.map(async (s) => {
      const { data: profile } = await supabase.from('user_profiles').select('full_name').eq('id', s.user_id).single();
      const activity = activities.find(a => a.id === s.activity_id);
      return { ...s, user_profiles: profile, activity };
    }));

    // Calculate statistics
    const pending = enrichedSubmissions.filter(s => s.status !== 'graded');
    const graded = enrichedSubmissions.filter(s => s.status === 'graded');
    const overdue = enrichedSubmissions.filter(s => s.activity?.due_date && new Date(s.activity.due_date) < new Date() && s.status !== 'graded');
    
    document.getElementById('statPending').textContent = pending.length;
    document.getElementById('statGraded').textContent = graded.length;

    // Display pending submissions with better formatting
    const pendingEl = document.getElementById('pendingSubmissions');
    pendingEl.innerHTML = '';
    
    if (!pending.length) {
      document.getElementById('submissionsEmpty').style.display = 'block';
    } else {
      document.getElementById('submissionsEmpty').style.display = 'none';
      pending.slice(0, 10).forEach(s => {
        const activity = s.activity;
        const studentName = (s.user_profiles?.full_name || s.user_id).slice(0, 30);
        const activityTitle = (activity?.title || 'Activity').slice(0, 40);
        const typeIcon = getActivityIcon(activity?.activity_type);
        
        const row = document.createElement('div');
        row.className = 'submission-item';
        row.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1" style="min-width: 0;">
              <div style="font-weight: 600; font-size: 14px; color: #5C3422;">${typeIcon} ${activityTitle}</div>
              <div style="font-size: 12px; color: #999; margin-top: 4px;">👤 ${studentName}</div>
            </div>
            <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #FFE8D6; color: #D97706;">${s.status.toUpperCase()}</span>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <a style="flex: 1; padding: 6px 8px; background: #FF6B35; color: white; border-radius: 4px; text-align: center; text-decoration: none; font-size: 12px; font-weight: 600;" href="/TEMPLATES/FrameAssignmentGrade.html?activity_id=${encodeURIComponent(s.activity_id)}">Grade</a>
            <a style="flex: 1; padding: 6px 8px; background: #F9F6F0; color: #5C3422; border: 1px solid #E2D5C2; border-radius: 4px; text-align: center; text-decoration: none; font-size: 12px; font-weight: 600;" href="/TEMPLATES/FrameClassDetail.html?id=${encodeURIComponent(activity?.class_id)}">View</a>
          </div>
        `;
        pendingEl.appendChild(row);
      });
    }

    // Activity breakdown by type
    const activityCounts = {};
    const activityStatuses = {};
    activities.forEach(a => {
      const type = a.activity_type;
      activityCounts[type] = (activityCounts[type] || 0) + 1;
      
      const subs = submissions.filter(s => s.activity_id === a.id);
      const gradedCount = subs.filter(s => s.status === 'graded').length;
      const totalCount = subs.length;
      activityStatuses[type] = activityStatuses[type] || { graded: 0, total: 0 };
      activityStatuses[type].graded += gradedCount;
      activityStatuses[type].total += totalCount;
    });

    // Update quick stats
    document.getElementById('countAssignments').textContent = activityCounts['assignment'] || 0;
    document.getElementById('countQuizzes').textContent = activityCounts['quiz'] || 0;

    const breakdownEl = document.getElementById('activityBreakdown');
    breakdownEl.innerHTML = '';
    const activityTypes = ['assignment', 'quiz', 'reflection', 'discussion'];
    activityTypes.forEach(type => {
      if (activityCounts[type]) {
        const icon = getActivityIcon(type);
        const label = getActivityTypeLabel(type);
        const stats = activityStatuses[type];
        const percent = stats.total > 0 ? Math.round((stats.graded / stats.total) * 100) : 0;
        
        const div = document.createElement('div');
        div.style.cssText = 'padding: 12px; background: #F9F6F0; border-radius: 8px; border: 1px solid #E2D5C2;';
        div.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 600; color: #5C3422;">${icon} ${label}</span>
            <span style="font-size: 12px; color: #999;">${stats.graded}/${stats.total}</span>
          </div>
          <div style="background: #E2D5C2; border-radius: 4px; height: 6px; overflow: hidden;">
            <div style="background: #FF6B35; height: 100%; width: ${percent}%;"></div>
          </div>
        `;
        breakdownEl.appendChild(div);
      }
    });

    // Upcoming due items (next 14 days)
    const now = new Date();
    const upcoming = activities.filter(a => {
      if (!a.due_date) return false;
      const due = new Date(a.due_date);
      const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 14;
    }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 8);

    const ul = document.getElementById('upcomingList');
    const emptyUpcoming = document.getElementById('upcomingEmpty');
    ul.innerHTML = '';
    
    if (upcoming.length === 0) {
      emptyUpcoming.style.display = 'block';
    } else {
      emptyUpcoming.style.display = 'none';
      upcoming.forEach(u => {
        const daysUntil = Math.ceil((new Date(u.due_date) - now) / (1000 * 60 * 60 * 24));
        const urgentStyle = daysUntil <= 1 ? 'color: #D97706; font-weight: 600;' : 'color: #5C3422;';
        const icon = getActivityIcon(u.activity_type);
        
        const li = document.createElement('li');
        li.style.cssText = `${urgentStyle} border-left: 3px solid #FF6B35; padding-left: 8px; padding-top: 8px; padding-bottom: 8px; list-style: none;`;
        li.innerHTML = `
          <div style="font-weight: 600; font-size: 13px;">${icon} ${(u.title || '').slice(0, 30)}</div>
          <div style="font-size: 12px; color: #999; margin-top: 2px;">Due: ${fmtDate(u.due_date)}</div>
        `;
        ul.appendChild(li);
      });
    }

    // Wire up dropdown toggle for Create Activity
    const createActivityBtn = document.getElementById('createActivityBtn');
    const createActivityDropdown = document.getElementById('createActivityDropdown');
    
    if (createActivityBtn && createActivityDropdown) {
      createActivityBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        createActivityDropdown.classList.toggle('active');
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!createActivityDropdown.contains(e.target)) {
          createActivityDropdown.classList.remove('active');
        }
      });
    }

  }catch(e){ 
    console.error('instructordashboard', e);
    document.getElementById('subMsg').textContent = 'Error loading dashboard: ' + e.message;
  }
});
