import { supabase } from './supabase-auth.js';
import { loadNavigation, setupLogout } from './navigation-loader.js';

function fmtDate(d) { 
  if (!d) return 'TBD'; 
  return new Date(d).toLocaleString(); 
}

function escapeHTML(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function getUsername(userId) {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();
    return data?.full_name || userId;
  } catch (e) {
    return userId;
  }
}

document.addEventListener('DOMContentLoaded', async function(){
  // Load navigation
  await loadNavigation('nav-container');
  setupLogout();

  const params = new URLSearchParams(location.search);
  const id = params.get('id') || params.get('assignment');
  const container = document.getElementById('assignmentContainer');
  
  if (!id){ 
    container.innerHTML = '<div class="p-4 text-red-600">No assignment specified.</div>'; 
    return; 
  }

  try {
    // Fetch activity (unified activities system) - handles assignment, quiz, reflection, discussion
    const { data: a, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    if (!a) { 
      container.innerHTML = '<div class="p-4 text-gray-600">Activity not found.</div>'; 
      return; 
    }

    // Update title based on activity type
    const typeLabel = { 'assignment': 'Assignment', 'quiz': 'Quiz', 'reflection': 'Reflection', 'discussion': 'Discussion' }[a.activity_type] || 'Activity';
    document.querySelector('title').textContent = typeLabel + ' Detail';
    document.getElementById('assignmentTitle').textContent = a.title || 'Untitled';
    document.getElementById('assignmentDue').textContent = fmtDate(a.due_date);
    document.getElementById('assignmentPoints').textContent = a.points || '—';
    document.getElementById('assignmentInstructions').innerHTML = escapeHTML(a.description) || '<div class="text-sm text-gray-600">No further instructions.</div>';

    // Handle file attachments
    const attachEl = document.getElementById('assignmentAttachments');
    attachEl.innerHTML = '';
    if (a.file_url) {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'attachment-item';
      itemDiv.innerHTML = `
        <div class="attachment-icon">
          <svg data-lucide="file"></svg>
        </div>
        <a href="${a.file_url}" target="_blank" class="attachment-link">${a.file_url.split('/').pop() || 'View File'}</a>
      `;
      attachEl.appendChild(itemDiv);
    } else {
      attachEl.textContent = 'No attachments.';
    }

    // Class link
    if (a.class_id) {
      const { data: cls } = await supabase
        .from('classes')
        .select('class_name')
        .eq('id', a.class_id)
        .maybeSingle();
      
      if (cls) {
        const link = document.getElementById('assignmentClassLink');
        link.textContent = cls.class_name || 'Class';
        link.href = '/TEMPLATES/FrameClassDetail.html?id=' + encodeURIComponent(a.class_id);
      }
    }

    // Fetch submissions from unified activity_submissions table
    const subEl = document.getElementById('submissionsList');
    subEl.innerHTML = '';
    
    const { data: subs, error: se } = await supabase
      .from('activity_submissions')
      .select('id, user_id, status, score, grade_letter, submitted_at, graded_at, submission_text')
      .eq('activity_id', id)
      .order('submitted_at', { ascending: false });
    
    if (se) throw se;
    
    if (subs && subs.length) {
      for (const s of subs) {
        const username = await getUsername(s.user_id);
        const when = s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'Not submitted';
        const gradedTime = s.graded_at ? new Date(s.graded_at).toLocaleString() : '';
        
        const statusMap = {
          'draft': 'pending',
          'submitted': 'submitted',
          'graded': 'graded',
          'late': 'submitted'
        };
        const statusClass = statusMap[s.status] || 'pending';
        
        const gradeInfo = s.grade_letter ? `Grade: ${s.grade_letter}` : '';
        const scoreInfo = s.score !== null && s.score !== undefined ? `Score: ${s.score}%` : '';
        
        const div = document.createElement('div');
        div.className = 'submission-item';
        div.innerHTML = `
          <div class="submission-header">
            <span class="submission-user">${escapeHTML(username)}</span>
            <span class="submission-status status-${statusClass}">${s.status || 'Submitted'}</span>
          </div>
          <div class="submission-meta">
            <span>Submitted: ${when}</span>
            ${gradedTime ? `<span>Graded: ${gradedTime}</span>` : ''}
          </div>
          ${gradeInfo || scoreInfo ? `<div class="submission-meta">
            ${gradeInfo ? `<span>${gradeInfo}</span>` : ''}
            ${scoreInfo ? `<span>${scoreInfo}</span>` : ''}
          </div>` : ''}
        `;
        
        // For reflections, show submission text
        if (a.activity_type === 'reflection' && s.submission_text) {
          div.innerHTML += `<div class="submission-text">${escapeHTML(s.submission_text)}</div>`;
        }
        
        subEl.appendChild(div);
      }
    } else {
      subEl.innerHTML = `
        <div class="no-submissions">
          <svg data-lucide="inbox"></svg>
          <p>No submissions yet.</p>
        </div>
      `;
    }
    
    lucide.createIcons();

    // Button handlers - hide submit button for instructors viewing reflections
    const btnSubmit = document.getElementById('btnSubmitAssignment');
    if (a.activity_type === 'reflection') {
      btnSubmit.style.display = 'none'; // Instructors shouldn't submit reflections
    } else {
      btnSubmit.addEventListener('click', function(){
        location.href = '/TEMPLATES/FrameAssignmentSubmit.html?id=' + encodeURIComponent(id);
      });
    }

    const btnBack = document.getElementById('btnBackAssignments');
    btnBack.addEventListener('click', function(){
      const typeFilter = a.activity_type === 'reflection' ? 'reflection' : a.activity_type || 'assignment';
      location.href = '/TEMPLATES/FrameActivities.html?type=' + encodeURIComponent(typeFilter);
    });

  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="error-message">Failed to load assignment. Please try again.</div>';
  }
});
