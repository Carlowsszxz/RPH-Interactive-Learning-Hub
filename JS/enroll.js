
import { supabase, getUser } from './supabase-auth.js';

async function loadClasses(){
  const sel = document.getElementById('selectClass');
  if (!sel) return;
  try{
    const { data, error } = await supabase.from('classes').select('id,class_name,class_code,description').order('class_name');
    if (error) throw error;
    data.forEach(c=>{
      const o = document.createElement('option'); o.value = c.id; o.textContent = `${c.class_name} — ${c.class_code}`; o.dataset.desc = c.description || '';
      sel.appendChild(o);
    });
  }catch(e){ console.error(e); }
}

// Load and display logged-in user's info
async function loadUserInfo(){
  try {
    const userResp = await getUser();
    const user = userResp && userResp.data && userResp.data.user ? userResp.data.user : null;
    
    if (!user) {
      document.getElementById('displayName').textContent = 'Not signed in';
      document.getElementById('displayEmail').textContent = 'Please sign in first';
      return user;
    }
    
    // Fetch user profile from database
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('full_name, user_email')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      document.getElementById('displayName').textContent = user.email || 'User';
      document.getElementById('displayEmail').textContent = user.email || '—';
      return user;
    }
    
    // Display user info
    document.getElementById('displayName').textContent = profile?.full_name || user.email || 'User';
    document.getElementById('displayEmail').textContent = profile?.user_email || user.email || '—';
    
    return user;
  } catch (err) {
    console.error('Error loading user info:', err);
    document.getElementById('displayName').textContent = 'Error loading profile';
    document.getElementById('displayEmail').textContent = '—';
    return null;
  }
}

function setSelectedClass(id, title, code, desc){
  document.getElementById('classId').value = id || '';
  document.getElementById('classTitle').textContent = title || 'Selected Class';
  document.getElementById('classCode').textContent = 'Code: ' + (code || '—');
  document.getElementById('classDesc').textContent = desc || '';
}

document.addEventListener('DOMContentLoaded', async function(){
  // Load user info first
  const currentUser = await loadUserInfo();
  
  await loadClasses();

  const sel = document.getElementById('selectClass');
  const codeInput = document.getElementById('joinCode');

  sel.addEventListener('change', function(){
    const opt = sel.options[sel.selectedIndex];
    if (!opt || !opt.value) { setSelectedClass('', 'Selected Class', '', ''); return; }
    setSelectedClass(opt.value, opt.textContent.split(' — ')[0], opt.textContent.split(' — ')[1]||'', opt.dataset.desc||'');
  });

  codeInput.addEventListener('change', function(){
    // clear selection when code is entered
    if (codeInput.value) sel.value = '';
  });

  document.getElementById('cancelEnroll').addEventListener('click', function(){ window.history.back(); });

  document.getElementById('enrollForm').addEventListener('submit', async function(e){
    e.preventDefault();
    const msg = document.getElementById('enrollMsg'); msg.textContent = '';
    const notes = document.getElementById('notes').value.trim();
    let classId = document.getElementById('classId').value;
    const code = codeInput.value.trim();

    if (!classId && code){
      // look up by class_code
      const { data, error } = await supabase.from('classes').select('id,class_name,class_code').eq('class_code', code).maybeSingle();
      if (error || !data){ msg.textContent = 'Class code not found.'; return; }
      classId = data.id;
      setSelectedClass(data.id, data.class_name, data.class_code, '');
    }

    if (!classId){ msg.textContent = 'Please select a class or enter a valid code.'; return; }

    // Use current user already loaded
    if (!currentUser){ msg.textContent = 'You must be signed in to enroll. Please sign in and try again.'; return; }

    try{
      const payload = { user_id: currentUser.id, class_id: classId, role: 'student' };
      const { data, error } = await supabase.from('class_enrollments').insert(payload).select();
      if (error){
        if (error.code === '23505' || (error.details && error.details.includes('unique'))) msg.textContent = 'You are already enrolled in this class.';
        else msg.textContent = 'Enrollment failed: ' + (error.message||error.toString());
        return;
      }
      msg.textContent = 'Enrollment successful!';
      msg.className = 'text-green-600';
      // optionally redirect
      setTimeout(()=> location.href = '/TEMPLATES/FrameClassDetail.html?id=' + encodeURIComponent(classId), 1200);
    }catch(err){ console.error(err); msg.textContent = 'Enrollment failed.'; }
  });
});
