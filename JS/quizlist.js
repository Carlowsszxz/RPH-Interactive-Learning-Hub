import { supabase } from './supabase-auth.js';
import { loadNavigation, setupLogout } from './navigation-loader.js';

function fmtDate(d){ if (!d) return 'TBD'; return new Date(d).toLocaleString(); }

function renderQuizList(container, items){
  container.innerHTML = '';
  if (!items || items.length === 0){ 
    container.innerHTML = '<div style="padding: 32px 16px; text-align: center; color: #999; font-size: 14px;"><svg data-lucide="inbox" width="32" height="32" style="display: inline; margin-bottom: 8px; opacity: 0.5;"></svg><div>No quizzes found</div></div>'; 
    return; 
  }
  items.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    
    // Generate icon with first letter or icon
    const icon = document.createElement('div');
    icon.className = 'quiz-card-icon';
    icon.textContent = (q.title || 'Q').charAt(0).toUpperCase();
    
    // Content wrapper
    const content = document.createElement('div');
    content.className = 'quiz-card-content';
    
    // Title
    const title = document.createElement('div');
    title.className = 'quiz-card-title';
    title.textContent = q.title || 'Untitled Quiz';
    content.appendChild(title);
    
    // Description
    const desc = document.createElement('div');
    desc.className = 'quiz-card-desc';
    desc.textContent = (q.description || 'No description provided').slice(0, 200);
    content.appendChild(desc);
    
    // Metadata
    const meta = document.createElement('div');
    meta.className = 'quiz-card-meta';
    
    const timeLimit = q.time_limit_minutes ? `${q.time_limit_minutes} min` : 'No limit';
    meta.innerHTML = `
      <span><svg data-lucide="clock" width="14" height="14"></svg>${timeLimit}</span>
      <span><svg data-lucide="help-circle" width="14" height="14"></svg>${q.questions ? q.questions.length : 0} questions</span>
      <span><span class="quiz-status-badge quiz-status-${q.status || 'active'}">${(q.status || 'active').toUpperCase()}</span></span>
    `;
    content.appendChild(meta);
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'quiz-card-actions';
    
    const startBtn = document.createElement('a');
    startBtn.className = 'quiz-btn quiz-btn-start';
    startBtn.href = '/TEMPLATES/FrameQuizTake.html?id=' + encodeURIComponent(q.id);
    startBtn.innerHTML = '<svg data-lucide="play" width="14" height="14" style="display: inline; margin-right: 4px; vertical-align: middle;"></svg>Take Quiz';
    actions.appendChild(startBtn);
    
    card.appendChild(icon);
    card.appendChild(content);
    card.appendChild(actions);
    container.appendChild(card);
  });
  
  // Re-render lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await loadNavigation('nav-container');
  setupLogout();

  if (window.lucide) {
    window.lucide.createIcons();
  }

  const container = document.getElementById('quizList');
  const pageInfo = document.getElementById('pageInfo');
  let currentPage = 1; 
  const perPage = 10;

  async function load(){
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        container.innerHTML = '<div class="p-4 text-red-600">Not authenticated</div>';
        return;
      }

      // Check if user is instructor
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.data.user.id)
        .single();

      const isInstructor = profile?.role === 'instructor';

      const q = document.getElementById('qSearch')?.value.trim() || '';
      const sort = document.getElementById('sortBy')?.value || 'created_at';
      const from = (currentPage-1)*perPage;

      let builder = supabase
        .from('quizzes')
        .select('id, title, description, status, time_limit_minutes, class_id, created_at, created_by')
        .range(from, from + perPage - 1);

      if (isInstructor) {
        // Instructors see all their quizzes regardless of status
        builder = builder.eq('created_by', user.data.user.id);
      } else {
        // Students see active quizzes in their enrolled classes
        const { data: enrollments, error: enrollError } = await supabase
          .from('class_enrollments')
          .select('class_id')
          .eq('user_id', user.data.user.id);

        if (enrollError || !enrollments || enrollments.length === 0) {
          container.innerHTML = '<div class="p-4 text-gray-600">Not enrolled in any classes yet</div>';
          return;
        }

        const classIds = enrollments.map(e => e.class_id);
        builder = builder
          .in('class_id', classIds)
          .eq('status', 'active'); // Only show active quizzes to students
      }

      if (q) {
        builder = builder.ilike('title', `%${q}%`);
      }

      if (sort === 'title') {
        builder = builder.order('title', {ascending:true});
      } else {
        builder = builder.order('created_at', {ascending:false});
      }

      const { data, error } = await builder;
      if (error) throw error;

      renderQuizList(container, data || []);
      document.getElementById('quizCount').textContent = (data || []).length;
      pageInfo.textContent = currentPage;
    } catch(e) { 
      console.error(e); 
      container.innerHTML = '<div class="p-4 text-red-600">Failed to load quizzes: ' + (e.message || JSON.stringify(e)) + '</div>'; 
    }
  }

  document.getElementById('qSearch')?.addEventListener('input', ()=>{ currentPage=1; load(); });
  document.getElementById('sortBy')?.addEventListener('change', ()=>{ currentPage=1; load(); });
  document.getElementById('prevPage')?.addEventListener('click', ()=>{ if (currentPage>1){ currentPage--; load(); }});
  document.getElementById('nextPage')?.addEventListener('click', ()=>{ currentPage++; load(); });

  // initial load
  load();
});
