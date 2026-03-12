import { supabase } from './supabase-auth.js';
import { loadNavigation, setupLogout } from './navigation-loader.js';

let allActivities = [];
let userClasses = [];
let currentFilter = 'all';
let currentClassFilter = '';
let currentSearch = '';

/**
 * Fetch user's enrolled classes
 */
async function fetchUserClasses() {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id, classes(id, class_name)')
      .eq('user_id', user.id);

    if (enrollments) {
      userClasses = enrollments
        .map(e => e.classes)
        .filter(c => c !== null);
      populateClassFilter();
    }
  } catch (error) {
    console.error('Error fetching classes:', error);
  }
}

/**
 * Populate class filter dropdown
 */
function populateClassFilter() {
  const select = document.getElementById('classFilter');
  userClasses.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls.id;
    option.textContent = cls.class_name;
    select.appendChild(option);
  });
}

/**
 * Fetch activities for user's enrolled classes
 */
async function fetchActivities() {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    // Get user's enrolled classes
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('user_id', user.id);

    const classIds = enrollments?.map(e => e.class_id) || [];

    if (classIds.length === 0) {
      allActivities = [];
      renderActivities();
      return;
    }

    // Fetch published activities from user's classes
    let query = supabase
      .from('activities')
      .select(`
        id,
        title,
        description,
        activity_type,
        due_date,
        points,
        class_id,
        is_published,
        classes(class_name)
      `)
      .eq('is_published', true)
      .in('class_id', classIds)
      .order('due_date', { ascending: true });

    const { data: activities, error: actError } = await query;

    if (actError) throw actError;

    // Fetch quizzes from user's enrolled classes
    const { data: quizzes, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        description,
        status,
        class_id,
        created_at,
        classes(class_name)
      `)
      .eq('status', 'active')
      .in('class_id', classIds)
      .order('created_at', { ascending: false });

    if (quizError) throw quizError;

    // Convert activities to standardized format
    let allItems = (activities || []).map(a => ({
      ...a,
      activity_type: a.activity_type,
      due_date: a.due_date,
      points: a.points || 0
    }));

    // Convert quizzes to standardized format matching activities structure
    const convertedQuizzes = (quizzes || []).map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      activity_type: 'quiz',
      due_date: null,
      points: 0,
      class_id: q.class_id,
      is_published: true,
      classes: q.classes,
      created_at: q.created_at
    }));

    // Combine both arrays
    allItems = [...allItems, ...convertedQuizzes];

    // Fetch submissions for this user to show status and grades (only for activities)
    const { data: submissions } = await supabase
      .from('activity_submissions')
      .select('activity_id, status, score, grade_letter')
      .eq('user_id', user.id);

    const submissionMap = {};
    submissions?.forEach(s => {
      submissionMap[s.activity_id] = s;
    });

    // Attach submission info to activities (quizzes won't have submissions in this table)
    allActivities = allItems.map(item => ({
      ...item,
      submission: submissionMap[item.id]
    }));

    renderActivities();
  } catch (error) {
    console.error('Error fetching activities:', error);
    document.getElementById('activitiesList').innerHTML = '<div class="text-red-600">Error loading activities</div>';
  }
}

/**
 * Render activities based on current filters and search
 */
function renderActivities() {
  let filtered = allActivities;

  // Filter by type
  if (currentFilter !== 'all') {
    filtered = filtered.filter(a => a.activity_type === currentFilter);
  }

  // Filter by class
  if (currentClassFilter) {
    filtered = filtered.filter(a => a.class_id === currentClassFilter);
  }

  // Filter by search
  if (currentSearch) {
    const search = currentSearch.toLowerCase();
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(search) ||
      (a.description && a.description.toLowerCase().includes(search))
    );
  }

  const listEl = document.getElementById('activitiesList');
  const emptyEl = document.getElementById('emptyState');

  if (filtered.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  listEl.innerHTML = filtered.map(activity => createActivityCard(activity)).join('');

  // Render icons
  lucide.createIcons();

  // Add click handlers
  listEl.querySelectorAll('.activity-card').forEach((card, i) => {
    card.addEventListener('click', () => openActivity(filtered[i]));
  });
}

/**
 * Get activity icon name for Lucide
 */
function getActivityIconName(type) {
  const icons = {
    'assignment': 'clipboard',
    'quiz': 'help-circle',
    'reflection': 'lightbulb',
    'discussion': 'message-circle'
  };
  return icons[type] || 'file';
}

/**
 * Create activity card HTML
 */
function createActivityCard(activity) {
  const iconName = getActivityIconName(activity.activity_type);
  const typeLabel = formatActivityType(activity.activity_type);
  const { dueClass, dueText } = getDueDate(activity.due_date);
  const submission = activity.submission;

  let statusHtml = '';
  let pointsHtml = '';

  // Only show status and points for activities, not quizzes
  if (activity.activity_type !== 'quiz') {
    if (submission) {
      const statusClass = `status-${submission.status}`;
      statusHtml = `<span class="status-badge ${statusClass}">${formatStatus(submission.status)}</span>`;
      if (submission.grade_letter) {
        statusHtml += ` <span style="margin-left: 0.5rem; font-size: 1rem; font-weight: 700; color: #6B8E23;">${submission.grade_letter}</span>`;
      }
    } else {
      statusHtml = '<span class="status-badge status-draft">Not Started</span>';
    }

    if (activity.points) {
      pointsHtml = `<div class="activity-meta-item">
        <span>Points: ${activity.points}</span>
      </div>`;
      if (submission && submission.score !== null) {
        pointsHtml += `<div class="activity-meta-item"><span>Score: ${submission.score}/${activity.points}</span></div>`;
      }
    }
  } else {
    // For quizzes, show "Ready to Take" status
    statusHtml = '<span class="status-badge" style="background: #4CAF50; color: white;">Ready</span>';
  }

  let descriptionHtml = '';
  if (activity.description) {
    descriptionHtml = `<div style="margin-top: 0.5rem; font-size: 0.9rem; color: #7A5B47;">${escapeHTML(activity.description)}</div>`;
  }

  return `
    <div class="activity-card ${activity.activity_type}">
      <div class="activity-content">
        <div class="activity-header">
          <div class="activity-icon">
            <i data-lucide="${iconName}"></i>
          </div>
          <div>
            <h3 class="activity-title">${escapeHTML(activity.title)}</h3>
            <div class="activity-meta">
              <div class="activity-meta-item">${escapeHTML(activity.classes.class_name)}</div>
              <div class="activity-meta-item">•</div>
              <div class="activity-meta-item">${typeLabel}</div>
            </div>
          </div>
        </div>
        ${descriptionHtml}
        ${pointsHtml ? `<div class="activity-meta" style="margin-top: 0.75rem;">
          ${pointsHtml}
        </div>` : ''}
      </div>
      <div class="activity-sidebar">
        <span class="due-date ${dueClass}">${dueText}</span>
        ${statusHtml}
      </div>
    </div>
  `;
}

/**
 * Format activity type for display
 */
function formatActivityType(type) {
  const types = {
    'assignment': 'Assignment',
    'quiz': 'Quiz',
    'reflection': 'Reflection',
    'discussion': 'Discussion'
  };
  return types[type] || type;
}

/**
 * Get due date styling and text
 */
function getDueDate(dueDate) {
  if (!dueDate) return { dueClass: '', dueText: 'No due date' };

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let dueClass = 'due-date-completed';
  let dueText = due.toLocaleDateString();

  if (diffMs > 0) {
    if (diffDays <= 1) {
      dueClass = 'due-date-upcoming';
      dueText = 'Due today';
    } else if (diffDays <= 3) {
      dueClass = 'due-date-upcoming';
      dueText = `Due in ${diffDays} days`;
    } else {
      dueText = 'Due ' + due.toLocaleDateString();
    }
  } else {
    dueClass = 'due-date-overdue';
    dueText = 'Overdue';
  }

  return { dueClass, dueText };
}

/**
 * Format submission status for display
 */
function formatStatus(status) {
  const statuses = {
    'draft': 'Draft',
    'submitted': 'Submitted',
    'graded': 'Graded',
    'late': 'Late'
  };
  return statuses[status] || status;
}

/**
 * Open activity detail page
 */
function openActivity(activity) {
  let url;
  switch (activity.activity_type) {
    case 'assignment':
      url = `/TEMPLATES/FrameAssignmentDetail.html?id=${activity.id}`;
      break;
    case 'quiz':
      url = `/TEMPLATES/FrameQuizTake.html?id=${activity.id}`;
      break;
    case 'reflection':
      url = `/TEMPLATES/FrameReflectionPromptList.html?id=${activity.id}`;
      break;
    case 'discussion':
      url = `/TEMPLATES/FrameForumBrowser.html?topic=${activity.id}`;
      break;
    default:
      return;
  }
  location.href = url;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Initialize page
 */
async function initActivitiesPage() {
  // Load navigation
  await loadNavigation('nav-container');
  setupLogout();

  // Render Lucide icons
  lucide.createIcons();

  // Set up event listeners
  document.querySelectorAll('.activity-filter').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.activity-filter').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.type;
      renderActivities();
      lucide.createIcons();
    });
  })

  document.getElementById('classFilter').addEventListener('change', function() {
    currentClassFilter = this.value;
    renderActivities();
  });

  document.getElementById('searchInput').addEventListener('input', function() {
    currentSearch = this.value;
    renderActivities();
  });

  // Fetch initial data
  await fetchUserClasses();
  await fetchActivities();

  // Refresh every 30 seconds
  setInterval(fetchActivities, 30000);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initActivitiesPage);
} else {
  initActivitiesPage();
}
