import { supabase, getUser } from './supabase-auth.js';

function getInitial(name){
  return (name || '?').charAt(0).toUpperCase();
}

function createAvatarSVG(initial){
  return `<div class="avatar-container">${initial}</div>`;
}

function setMsg(text, success){
  const el = document.getElementById('profileMsg'); 
  if (!el) return; 
  el.textContent = text || ''; 
  el.classList.remove('success', 'error');
  if (success) el.classList.add('success');
  else if (text) el.classList.add('error');
}

async function fetchProfile(){
  const resp = await getUser();
  const user = resp && resp.data && resp.data.user ? resp.data.user : null;
  if (!user) return { error: 'not-signed-in' };

  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) return { error };
  return { user: user, profile: data };
}

async function uploadAvatar(userId, file){
  if (!file) return null;
  try{
    const path = `user-${userId}/profile.jpg`;
    const { data, error } = await supabase.storage.from('profile-pictures').upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    const { data: publicURLData } = supabase.storage.from('profile-pictures').getPublicUrl(path);
    return publicURLData.publicUrl;
  }catch(e){ console.warn('avatar upload failed', e); return null; }
}

document.addEventListener('DOMContentLoaded', async function(){
  const res = await fetchProfile();
  if (res.error){ setMsg('You must be signed in to view profile.'); return; }

  const user = res.user;
  const profile = res.profile || {};

  const fullName = profile.full_name || user.user_metadata?.full_name || user.email.split('@')[0];
  const initial = getInitial(fullName);
  document.getElementById('fullName').value = fullName;
  document.getElementById('email').value = user.email || '';
  document.getElementById('username').value = profile.username || '';
  document.getElementById('studentId').value = profile.student_id || '';
  document.getElementById('bio').value = profile.bio || '';
  const avatarDisplay = document.getElementById('avatarDisplay');
  if (profile.avatar_url) {
    avatarDisplay.innerHTML = `<img src="${profile.avatar_url}" alt="avatar" class="avatar-img" onerror="this.style.display='none'">`;
  } else {
    avatarDisplay.innerHTML = createAvatarSVG(initial);
  }
  document.getElementById('fullNameDisplay').textContent = fullName;
  document.getElementById('memberSinceDisplay').textContent = 'Member since ' + new Date(profile.created_at || user.created_at || Date.now()).toLocaleDateString();

  // stats
  try{
    const [{ count: classesCount }, { count: assignmentsCount }, { data: quizAttempts }] = await Promise.all([
      supabase.from('class_enrollments').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('assignment_submissions').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('quiz_attempts').select('score').eq('user_id', user.id)
    ]);
    document.getElementById('statClasses').textContent = classesCount || 0;
    document.getElementById('statAssignments').textContent = assignmentsCount || 0;
    if (quizAttempts && quizAttempts.length){
      const avg = (quizAttempts.reduce((s,q)=>s+(q.score||0),0)/quizAttempts.length).toFixed(1);
      document.getElementById('statQuiz').textContent = avg;
    }
  }catch(e){ console.warn(e); }

  // logout
  document.getElementById('logoutBtn').addEventListener('click', async function(){
    try{ await supabase.auth.signOut(); location.reload(); }catch(e){ console.error(e); }
  });

  // save
  document.getElementById('saveProfile').addEventListener('click', async function(){
    setMsg('Saving...');
    const full_name = document.getElementById('fullName').value.trim();
    const username = document.getElementById('username').value.trim();
    const student_id = document.getElementById('studentId').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const fileInput = document.getElementById('avatarFile');
    let avatar_url = profile.avatar_url || null;
    if (fileInput && fileInput.files && fileInput.files[0]){
      const uploaded = await uploadAvatar(user.id, fileInput.files[0]);
      if (uploaded) avatar_url = uploaded;
    }

    try{
      const payload = {
        id: user.id,
        user_email: user.email,
        full_name,
        username,
        student_id,
        bio,
        avatar_url,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('user_profiles').upsert(payload, { returning: 'representation' });
      if (error) throw error;
      setMsg('Profile saved.', true);
  // update display
      const displayName = full_name || 'User';
      const displayInitial = getInitial(displayName);
      const avatarDisplay = document.getElementById('avatarDisplay');
      if (avatar_url) {
        avatarDisplay.innerHTML = `<img src="${avatar_url}" alt="avatar" class="avatar-img" onerror="this.style.display='none'">`;
      } else {
        avatarDisplay.innerHTML = createAvatarSVG(displayInitial);
      }
      document.getElementById('fullNameDisplay').textContent = displayName;
      setTimeout(()=> setMsg(''), 2000);
    }catch(err){ console.error(err); setMsg('Failed to save profile.', false); }
  });

  document.getElementById('changePassword').addEventListener('click', function(){
    // simple redirect to login/password flow — implement per your auth UI
    alert('Change password flow: use your auth provider UI.');
  });
  
  // Initialize icons
  lucide.createIcons();
});

