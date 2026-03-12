import fetchClassDetail from './classdetail-data.js';

function setText(id, text){ const el = document.getElementById(id); if (el) el.textContent = text || ''; }

function createBadge(status){
  const span = document.createElement('span');
  span.textContent = status || '';
  span.className = 'status-badge';
  if (status === 'active') span.classList.add('active');
  else if (status === 'upcoming') span.classList.add('upcoming');
  else span.classList.add('archived');
  return span;
}

function escapeHTML(s){ if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function getActivityTypeName(type){
  const names = {
    'assignment': 'Assignment',
    'quiz': 'Quiz',
    'reflection': 'Reflection',
    'discussion': 'Discussion'
  };
  return names[type] || 'Activity';
}

function getActivityTypeIcon(type){
  const icons = {
    'assignment': 'clipboard',
    'quiz': 'help-circle',
    'reflection': 'lightbulb',
    'discussion': 'message-circle'
  };
  return icons[type] || 'file';
}

function renderTopics(containerEl, topics, classId){
  containerEl.innerHTML = '';
  if (!topics || topics.length === 0){
    const div = document.createElement('div');
    div.className = 'empty-message';
    div.textContent = 'No topics yet';
    containerEl.appendChild(div);
    return;
  }
  
  const topicsList = document.createElement('ul');
  topicsList.className = 'topics-list';
  topicsList.style.listStyle = 'none';
  topicsList.style.padding = '0';
  topicsList.style.margin = '0';
  topicsList.style.display = 'flex';
  topicsList.style.flexDirection = 'column';
  topicsList.style.gap = '0.75rem';
  
  topics.forEach((t, i) => {
    const li = document.createElement('li');
    li.style.padding = '1rem';
    li.style.background = 'var(--bg-light)';
    li.style.border = '1px solid var(--border-color)';
    li.style.borderRadius = '6px';
    li.style.borderLeft = '4px solid var(--primary)';
    li.style.transition = 'all 0.2s ease';
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.gap = '1rem';
    
    const contentDiv = document.createElement('div');
    contentDiv.style.flex = '1';
    
    const titleEl = document.createElement('h4');
    titleEl.style.margin = '0 0 0.5rem 0';
    titleEl.style.fontWeight = '600';
    titleEl.style.color = 'var(--text-primary)';
    titleEl.innerHTML = escapeHTML(t.title);
    contentDiv.appendChild(titleEl);
    
    if (t.description) {
      const descEl = document.createElement('p');
      descEl.style.margin = '0';
      descEl.style.fontSize = '0.875rem';
      descEl.style.color = 'var(--text-secondary)';
      descEl.innerHTML = escapeHTML(t.description);
      contentDiv.appendChild(descEl);
    }
    
    // Add resource count badge if there are resources
    if (t.resources && t.resources.length > 0) {
      const badge = document.createElement('span');
      badge.style.display = 'inline-block';
      badge.style.background = 'rgba(255, 107, 53, 0.1)';
      badge.style.color = 'var(--primary)';
      badge.style.padding = '0.25rem 0.75rem';
      badge.style.borderRadius = '12px';
      badge.style.fontSize = '0.75rem';
      badge.style.fontWeight = '600';
      badge.style.marginTop = '0.5rem';
      badge.innerHTML = `${t.resources.length} resource${t.resources.length > 1 ? 's' : ''}`;
      contentDiv.appendChild(badge);
    }
    
    const btnDiv = document.createElement('div');
    btnDiv.style.display = 'flex';
    btnDiv.style.whiteSpace = 'nowrap';
    
    const btn = document.createElement('a');
    btn.href = `/TEMPLATES/FrameTopicDetail.html?topic=${t.id}&class=${classId}`;
    btn.style.padding = '0.5rem 1rem';
    btn.style.background = 'var(--primary)';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.fontSize = '0.875rem';
    btn.style.fontWeight = '600';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'all 0.2s ease';
    btn.style.textDecoration = 'none';
    btn.style.display = 'inline-block';
    btn.innerHTML = 'View Topic';
    
    btn.addEventListener('mouseover', function() {
      this.style.background = 'var(--primary-dark)';
    });
    btn.addEventListener('mouseout', function() {
      this.style.background = 'var(--primary)';
    });
    
    btnDiv.appendChild(btn);
    li.appendChild(contentDiv);
    li.appendChild(btnDiv);
    topicsList.appendChild(li);
  });
  
  containerEl.appendChild(topicsList);
}

async function init(){
  const result = await fetchClassDetail();
  if (result.error){ console.error('Error:', result.error); return; }
  const cls = result.class;
  const instr = result.instructor;
  const counts = result.counts;

  setText('className', cls.class_name);
  setText('classCode', cls.class_code);
  const badgeWrap = document.getElementById('statusBadge');
  if (badgeWrap){ badgeWrap.innerHTML=''; badgeWrap.appendChild(createBadge(cls.status)); }

  setText('statStudents', counts.students);
  setText('statTopics', counts.topics);
  setText('statActivities', counts.activities);

  setText('classDesc', cls.description || '');

  const topicsContainer = document.getElementById('topicsContainer');
  if (topicsContainer) renderTopics(topicsContainer, result.topics, cls.id);

  // Recent activities
  const recentActEl = document.getElementById('recentActivities');
  if (recentActEl){
    recentActEl.innerHTML = '';
    if (result.recentActivities && result.recentActivities.length){
      result.recentActivities.forEach(a =>{
        const li = document.createElement('li');
        li.className = 'activity-item';
        const iconName = getActivityTypeIcon(a.activity_type);
        const typeLabel = getActivityTypeName(a.activity_type);
        const dueDate = a.due_date ? new Date(a.due_date).toLocaleString() : '—';
        li.innerHTML = `
          <i data-lucide="${iconName}" class="activity-icon"></i>
          <div class="activity-content">
            <div class="activity-title">${escapeHTML(a.title||'Untitled')}</div>
            <div class="activity-meta">
              <span>${typeLabel}</span>
            </div>
          </div>
          <div class="activity-due">
            <span class="activity-due-label">Due</span>
            <span class="activity-due-date">${dueDate}</span>
          </div>
        `;
        recentActEl.appendChild(li);
      });
    } else {
      recentActEl.innerHTML = '<li class="empty-message">No recent activities</li>';
    }
  }
  lucide.createIcons();

  // Forum preview
  const forumEl = document.getElementById('forumPreview');
  if (forumEl) forumEl.innerHTML = '<p class="forum-preview">No recent discussions (forum not configured)</p>';

  // Instructor card
  if (instr){
    const avatarDisplay = document.getElementById('instructorAvatar');
    if (avatarDisplay) {
      const initial = (instr.full_name || '?').charAt(0).toUpperCase();
      if (instr.avatar_url) {
        avatarDisplay.innerHTML = `<div class="avatar-img-container"><img src="${instr.avatar_url}" alt="${instr.full_name}" onerror="this.style.display='none'"></div>`;
      } else {
        avatarDisplay.innerHTML = `<div class="avatar-img-container">${initial}</div>`;
      }
    }
    const card = document.getElementById('instructorCard');
    if (card){
      card.querySelector('.instr-name').textContent = instr.full_name || 'Instructor';
      card.querySelector('.instr-bio').textContent = instr.bio || '';
    }
  }

  // Action buttons minimal handlers
  document.getElementById('btnEnroll').addEventListener('click', function(){ alert('Enroll clicked — implement enrollment flow'); });
  document.getElementById('btnUnenroll').addEventListener('click', function(){ alert('Unenroll clicked — implement unenroll flow'); });

  document.getElementById('btnActivities').addEventListener('click', function(){
    if (cls && cls.id) {
      location.href = '/TEMPLATES/FrameAssignmentList.html?class_id=' + encodeURIComponent(cls.id);
    } else {
      location.href = '/TEMPLATES/FrameAssignmentList.html';
    }
  });
  document.getElementById('btnForum').addEventListener('click', function(){ location.href = '#'; });
  
  // Initialize all Lucide icons
  lucide.createIcons();
}

init();
