import { supabase } from './supabase-auth.js';

function fmtDate(d){ if (!d) return 'TBD'; return new Date(d).toLocaleString(); }

function renderSubmissionCard(sub, profile, onOpen){
  const div = document.createElement('div');
  div.className = 'p-3 bg-white border rounded';
  const userLabel = profile ? (profile.full_name || profile.user_email || profile.id) : sub.user_id;
  const submittedAt = fmtDate(sub.submitted_at || sub.created_at);
  let attachmentsHtml = '';
  if (sub.submission_url){
    try{
      const arr = typeof sub.submission_url === 'string' ? JSON.parse(sub.submission_url) : sub.submission_url;
      if (Array.isArray(arr)) attachmentsHtml = arr.map(u=>`<a href="${u}" target="_blank" class="block text-blue-600 text-sm">${u.split('/').pop()}</a>`).join('');
      else if (typeof arr === 'string') attachmentsHtml = `<a href="${arr}" target="_blank" class="block text-blue-600 text-sm">${arr.split('/').pop()}</a>`;
    }catch(e){}
  }
  div.innerHTML = `<div class="flex items-start justify-between"><div><div class="font-semibold">${userLabel}</div><div class="text-xs text-gray-600">${submittedAt}</div></div><div class="text-sm text-gray-600">Status: ${sub.status||'submitted'}</div></div><div class="mt-2 text-sm text-gray-800">${(sub.submission_text||'').slice(0,300)}</div><div class="mt-2">${attachmentsHtml}</div><div class="mt-3"><button class="open-grade px-3 py-1 bg-blue-600 text-white rounded">Grade</button></div>`;
  div.querySelector('.open-grade').addEventListener('click', ()=> onOpen(sub, profile));
  return div;
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const params = new URLSearchParams(location.search);
  const assignmentId = params.get('id') || params.get('assignment');
  const submissionsList = document.getElementById('submissionsList');
  const assignmentNameEl = document.getElementById('assignmentName');
  const btnBack = document.getElementById('btnBack');

  if (!assignmentId){ submissionsList.innerHTML = '<div class="p-4 text-red-600">No assignment specified.</div>'; return; }

  btnBack.addEventListener('click', ()=>{ history.back(); });

  async function load(){
    submissionsList.innerHTML = '<div class="p-4 text-sm text-gray-600">Loading submissions...</div>';
    try{
      const { data: assignment, error: aErr } = await supabase.from('assignments').select('id,title').eq('id', assignmentId).maybeSingle();
      if (aErr) throw aErr;
      if (assignment) assignmentNameEl.textContent = assignment.title || 'Assignment';

      const statusFilter = document.getElementById('filterStatus').value;
      const search = (document.getElementById('searchStudent').value || '').toLowerCase();

      let builder = supabase.from('assignment_submissions').select('*').eq('assignment_id', assignmentId).order('submitted_at',{ascending:false});
      if (statusFilter) builder = builder.eq('status', statusFilter);
      const { data, error } = await builder;
      if (error) throw error;
      const subs = data || [];

      // fetch profiles for users
      const uids = [...new Set(subs.map(s=>s.user_id).filter(Boolean))];
      let profiles = [];
      if (uids.length){ const { data: p } = await supabase.from('user_profiles').select('id,full_name,user_email,avatar_url').in('id', uids); profiles = p || []; }

      submissionsList.innerHTML = '';
      const filtered = subs.filter(s=>{
        if (!search) return true;
        const prof = profiles.find(p=>p.id === s.user_id) || {};
        return (prof.full_name||'').toLowerCase().includes(search) || (prof.user_email||'').toLowerCase().includes(search) || (s.user_id||'').toLowerCase().includes(search);
      });

      if (!filtered.length) { submissionsList.innerHTML = '<div class="p-4 text-sm text-gray-600">No submissions found.</div>'; return; }

      for (const s of filtered){
        const prof = profiles.find(p=>p.id===s.user_id) || null;
        const card = renderSubmissionCard(s, prof, openGrader);
        submissionsList.appendChild(card);
      }

    }catch(e){ console.error('load submissions', e); submissionsList.innerHTML = '<div class="p-4 text-red-600">Failed to load submissions.</div>'; }
  }

  function openGrader(sub, profile){
    // open an overlay grading panel
    const overlay = document.createElement('div'); overlay.className = 'fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50';
    const panel = document.createElement('div'); panel.className = 'bg-white w-full max-w-2xl rounded shadow p-4';
    overlay.appendChild(panel);
    const studentLabel = profile ? (profile.full_name || profile.user_email || profile.id) : sub.user_id;
    let attachmentsHtml = '';
    if (sub.submission_url){ try{ const arr = typeof sub.submission_url === 'string' ? JSON.parse(sub.submission_url) : sub.submission_url; if (Array.isArray(arr)) attachmentsHtml = arr.map(u=>`<a href="${u}" target="_blank" class="block text-blue-600">${u.split('/').pop()}</a>`).join(''); else if (typeof arr === 'string') attachmentsHtml = `<a href="${arr}" target="_blank" class="block text-blue-600">${arr.split('/').pop()}</a>`; }catch(e){} }
    panel.innerHTML = `
      <div class="flex items-start justify-between"><div><div class="font-semibold">${studentLabel}</div><div class="text-xs text-gray-600">Submitted: ${fmtDate(sub.submitted_at)}</div></div><div><button id="closeGrade" class="px-2 py-1 bg-gray-200 rounded">Close</button></div></div>
      <div class="mt-3 text-sm text-gray-800">${sub.submission_text || '<i>No text provided</i>'}</div>
      <div class="mt-2">${attachmentsHtml}</div>
      <div class="mt-4 grid grid-cols-1 gap-3">
        <label class="text-sm">Score</label>
        <input id="gradeScore" type="number" min="0" class="border rounded p-2" value="${sub.score || ''}">
        <label class="text-sm">Feedback</label>
        <textarea id="gradeFeedback" rows="6" class="border rounded p-2">${sub.feedback || ''}</textarea>
        <div class="flex gap-2">
          <button id="saveGrade" class="px-3 py-2 bg-green-600 text-white rounded">Save & Grade</button>
          <button id="saveDraft" class="px-3 py-2 bg-gray-200 rounded">Save Draft</button>
        </div>
        <div id="gradeStatus" class="text-sm text-gray-600"></div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.getElementById('closeGrade').addEventListener('click', ()=> overlay.remove());
    document.getElementById('saveDraft').addEventListener('click', async ()=>{
      const score = document.getElementById('gradeScore').value || null;
      const feedback = document.getElementById('gradeFeedback').value || null;
      document.getElementById('gradeStatus').textContent = 'Saving...';
      try{
        const { error } = await supabase.from('assignment_submissions').update({ score: score ? Number(score) : null, feedback, status: 'draft', updated_at: new Date().toISOString() }).eq('id', sub.id);
        if (error) throw error;
        document.getElementById('gradeStatus').textContent = 'Saved as draft.';
        load();
      }catch(e){ console.error(e); document.getElementById('gradeStatus').textContent = 'Save failed.'; }
    });

    document.getElementById('saveGrade').addEventListener('click', async ()=>{
      const score = document.getElementById('gradeScore').value || null;
      const feedback = document.getElementById('gradeFeedback').value || null;
      document.getElementById('gradeStatus').textContent = 'Grading...';
      try{
        const userRes = await supabase.auth.getUser(); const user = userRes?.data?.user || userRes?.user;
        if (!user){ document.getElementById('gradeStatus').textContent = 'Sign in required.'; return; }
        const payload = { score: score ? Number(score) : null, feedback, status: 'graded', graded_at: new Date().toISOString(), graded_by: user.id };
        const { error } = await supabase.from('assignment_submissions').update(payload).eq('id', sub.id);
        if (error) throw error;
        document.getElementById('gradeStatus').textContent = 'Graded.';
        setTimeout(()=>{ overlay.remove(); load(); }, 700);
      }catch(e){ console.error('grade error', e); document.getElementById('gradeStatus').textContent = 'Grading failed.'; }
    });
  }

  document.getElementById('filterStatus').addEventListener('change', load);
  document.getElementById('searchStudent').addEventListener('input', ()=> setTimeout(load, 300));

  load();
});
