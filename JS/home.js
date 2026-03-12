import { supabase } from './supabase-auth.js';

function escapeHTML(s){ if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function getSubjectClass(category) {
  const subjectMap = {
    'math': 'subject-mathematics',
    'science': 'subject-sciences',
    'language': 'subject-languages',
    'humanities': 'subject-humanities'
  };
  return subjectMap[category && category.toLowerCase()] || 'subject-default';
}

function getSubjectIcon(category) {
  const iconMap = {
    'math': 'calculator',
    'science': 'beaker',
    'language': 'book-open',
    'humanities': 'scroll-text'
  };
  return iconMap[category && category.toLowerCase()] || 'book';
}

document.addEventListener('DOMContentLoaded', async function(){
  // Try to get current session and user
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user || null;

    let displayName = 'User';
    let displayEmail = '';

    if (user) {
      displayEmail = user.email || '';
      // Try to fetch profile from user_profiles
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('id', user.id)
          .limit(1)
          .single();
        if (!profileError && profileData && profileData.username) displayName = profileData.username;
        else displayName = user.user_metadata?.name || user.email || 'User';
      } catch (err) {
        console.error('Error fetching profile', err);
        displayName = user.user_metadata?.name || user.email || 'User';
      }
    }

    document.getElementById('welcomeMsg').textContent = 'Welcome, ' + displayName;
    document.getElementById('subMsg').textContent = displayEmail;

  } catch (err) {
    console.error('Error getting session/user', err);
  }

  if (typeof populateDashboard === 'function') {
    try { populateDashboard({updateStat: function(i,val){document.getElementById('stat'+i).textContent=val;}, recentEl: document.getElementById('recentList')}); }
    catch(e){ console.error(e); }
  }

  // additional dashboard population
  async function loadDashboard(){
    try{
      const userResp = await supabase.auth.getSession();
      const user = userResp?.data?.session?.user;
      if (!user) return;

      // classes enrolled
      const { count: classesCount } = await supabase.from('class_enrollments').select('id', { count: 'exact' }).eq('user_id', user.id);
      document.getElementById('statClasses').textContent = classesCount || 0;

      // upcoming assignments (next 14 days)
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 14*24*60*60*1000).toISOString();
      const { data: upcoming } = await supabase.from('assignments').select('id,title,due_date,class_id').gte('due_date', now).lte('due_date', future).order('due_date',{ascending:true}).limit(10);
      const upEl = document.getElementById('upcomingAssignments'); upEl.innerHTML = '';
      if (upcoming && upcoming.length){
        upcoming.forEach(a=>{ const li=document.createElement('li'); li.textContent = `${a.title} — due ${a.due_date? new Date(a.due_date).toLocaleString() : 'TBD'}`; upEl.appendChild(li); });
        document.getElementById('statDue').textContent = upcoming.length;
      } else { upEl.innerHTML = '<li style="text-align: center; padding: 16px; color: #999;">No upcoming assignments</li>'; document.getElementById('statDue').textContent = 0; }

      // my classes (enrolled) - join classes table
      const { data: enrollRows } = await supabase.from('class_enrollments').select('class_id').eq('user_id', user.id);
      const classIds = (enrollRows||[]).map(r=>r.class_id).filter(id => id); // filter out null/undefined
      const myClassesEl = document.getElementById('myClasses'); myClassesEl.innerHTML='';
      if (classIds && classIds.length){
        const { data: classes, error: classError } = await supabase.from('classes').select('id,class_name,description,student_count').in('id', classIds).limit(12);
        if (classError) console.error('Error fetching classes:', classError);
        if (classes) { classes.forEach(c=>{
          // Use class_name to determine category/icon (no category column in schema)
          const categoryGuess = c.class_name ? (c.class_name.toLowerCase().includes('math') ? 'math' : c.class_name.toLowerCase().includes('science') ? 'science' : c.class_name.toLowerCase().includes('language') ? 'language' : 'humanities') : null;
          const subjectClass = getSubjectClass(categoryGuess);
          const iconType = getSubjectIcon(categoryGuess);
          
          const card = document.createElement('a');
          card.className = `home-class-card ${subjectClass}`;
          card.href = `/TEMPLATES/FrameClassDetail.html?id=${encodeURIComponent(c.id)}`;
          card.innerHTML = `
            <div class="home-class-card-background"></div>
            <div class="home-class-card-overlay">
              <div class="home-class-icon">
                <i data-lucide="${iconType}"></i>
              </div>
            </div>
            <div class="home-class-card-title">${escapeHTML(c.class_name||'Untitled Class')}</div>
            <div class="home-class-card-footer">
              <span class="home-class-instructor">${c.student_count||0} enrolled</span>
            </div>
          `;
          myClassesEl.appendChild(card);
        });
        
        // Initialize lucide icons
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
        } else {
          myClassesEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #999;">Failed to load classes. Please refresh the page.</div>';
        }
      } else {
        myClassesEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #999;">You are not enrolled in any classes. <a href="/TEMPLATES/FrameClassBrowser.html" style="color: #FF6B35; text-decoration: none;">Browse classes</a></div>';
      }

      // recent activity: recent submissions and quiz attempts
      const [subsResult, quizzesResult] = await Promise.all([
        supabase.from('assignment_submissions').select('id,assignment_id,submitted_at,status').eq('user_id', user.id).order('submitted_at',{ascending:false}).limit(5),
        supabase.from('quiz_attempts').select('id,quiz_id,score,started_at,completed_at').eq('user_id', user.id).order('completed_at',{ascending:false}).limit(5) // Use completed_at for ordering, fall back to started_at
      ]);
      const subs = subsResult?.data || [];
      const quizzes = quizzesResult?.data || [];
      if (subsResult?.error) console.error('Error fetching submissions:', subsResult.error);
      if (quizzesResult?.error) console.error('Error fetching quiz attempts:', quizzesResult.error);
      const recentEl = document.getElementById('recentList'); recentEl.innerHTML = '';
      if ((subs && subs.length) || (quizzes && quizzes.length)){
        (subs||[]).forEach(s => { const li=document.createElement('li'); li.textContent = `Submission ${s.assignment_id} — ${s.status} at ${new Date(s.submitted_at).toLocaleString()}`; recentEl.appendChild(li); });
        (quizzes||[]).forEach(q => { const li=document.createElement('li'); const timestamp = q.completed_at || q.started_at; li.textContent = `Quiz ${q.quiz_id} — score ${q.score||0} at ${new Date(timestamp).toLocaleString()}`; recentEl.appendChild(li); });
      } else { recentEl.innerHTML = '<li style="text-align: center; padding: 16px; color: #999;">No recent activity</li>'; }

      // leaderboard preview - top 5 by score
      const lbEl = document.getElementById('leaderboard'); lbEl.innerHTML='';
      const { data: lb, error: lbError } = await supabase.from('game_leaderboard').select('user_id,game_name,score').order('score',{ascending:false}).limit(5);
      if (lbError) console.error('Error fetching leaderboard:', lbError);
      if (lb && lb.length){ lb.forEach(row=>{ const li=document.createElement('li'); li.textContent = `${row.game_name} — ${row.score}`; lbEl.appendChild(li); }); }

    }catch(e){ console.error('dashboard load error', e); }
  }

  loadDashboard();

  // Handle navigation buttons
  const btnBrowse = document.getElementById('btnBrowse');
  if (btnBrowse) {
    btnBrowse.addEventListener('click', () => {
      window.location.href = '/TEMPLATES/FrameClassBrowser.html';
    });
  }

  const btnAssignments = document.getElementById('btnAssignments');
  if (btnAssignments) {
    btnAssignments.addEventListener('click', () => {
      window.location.href = '/TEMPLATES/FrameAssignmentList.html';
    });
  }

  const btnQuiz = document.getElementById('btnQuiz');
  if (btnQuiz) {
    btnQuiz.addEventListener('click', () => {
      window.location.href = '/TEMPLATES/FrameQuizList.html';
    });
  }

  // Handle logout in flexible way - check for multiple possible element IDs
  const logoutElements = [
    document.getElementById('navLogout'),
    document.getElementById('signOut'),
    document.getElementById('signOutMobile')
  ].filter(el => el !== null);
  
  logoutElements.forEach(navLogout => {
    if (navLogout) {
      navLogout.addEventListener('click', async function(e) {
        e.preventDefault();
        if (typeof handleLogout === 'function') {
          handleLogout();
          return;
        }
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.error('Sign out error', err);
        }
        window.location.href = window.location.origin + '/TEMPLATES/FrameLogin.html';
      });
    }
  });
});
