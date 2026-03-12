import { supabase } from './supabase-auth.js';

function fmtDate(d){ if (!d) return 'TBD'; return new Date(d).toLocaleString(); }

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const assignmentId = params.get('assignment') || params.get('id');
  const assignmentRef = document.getElementById('assignmentRef');
  const fileInput = document.getElementById('submissionFiles');
  const fileList = document.getElementById('fileList');
  const submitBtn = document.getElementById('btnSubmit');
  const cancelBtn = document.getElementById('btnCancel');
  const statusEl = document.getElementById('submitStatus');

  if (!assignmentId){ assignmentRef.textContent = 'No assignment specified.'; submitBtn.disabled = true; return; }

  // Load assignment summary
  try{
    const { data: a, error } = await supabase.from('activities').select('id,title,due_date,points,class_id').eq('id', assignmentId).eq('activity_type', 'assignment').maybeSingle();
    if (error) throw error;
    if (!a){ assignmentRef.textContent = 'Assignment not found.'; submitBtn.disabled = true; return; }
    const clsNameRes = await supabase.from('classes').select('class_name').eq('id', a.class_id).maybeSingle();
    const clsName = clsNameRes.data ? (clsNameRes.data.class_name || '') : '';
    assignmentRef.innerHTML = `<strong>${a.title}</strong> — Due: ${fmtDate(a.due_date)} ${clsName?('<span class="ml-2 text-gray-600">for '+clsName+'</span>'):''}`;
  }catch(e){ console.error(e); assignmentRef.textContent = 'Failed to load assignment.'; }

  // File list preview
  fileInput.addEventListener('change', ()=>{
    const files = Array.from(fileInput.files || []);
    if (!files.length) { fileList.textContent = 'No files selected.'; return; }
    fileList.innerHTML = '';
    files.forEach(f=>{
      const li = document.createElement('div'); li.className='text-sm'; li.textContent = `${f.name} (${Math.round(f.size/1024)} KB)`; fileList.appendChild(li);
    });
  });

  cancelBtn.addEventListener('click', ()=>{ history.back(); });

  submitBtn.addEventListener('click', async ()=>{
    statusEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try{
      // Check auth
      const userRes = await supabase.auth.getUser();
      const user = userRes?.data?.user || userRes?.user;
      if (!user){ statusEl.textContent = 'You must be signed in to submit.'; submitBtn.disabled = false; submitBtn.textContent = 'Submit'; return; }

      const text = document.getElementById('submissionText').value.trim();
      const external = document.getElementById('submissionUrl').value.trim();
      const files = Array.from(fileInput.files || []);

      if (!text && !external && files.length === 0){ statusEl.textContent = 'Please provide text, a link, or attach files.'; submitBtn.disabled = false; submitBtn.textContent = 'Submit'; return; }

      // Upload files (if any)
      const uploadedUrls = [];
      if (files.length){
        for (const f of files){
          const timestamp = Date.now();
          const path = `submissions/${assignmentId}/${user.id}/${timestamp}-${f.name}`;
          const { data: up, error: upErr } = await supabase.storage.from('submissions').upload(path, f, { cacheControl: '3600', upsert: false });
          if (upErr){ console.error('upload error', upErr); throw upErr; }
          const { data: pub } = supabase.storage.from('submissions').getPublicUrl(path);
          const url = pub?.publicUrl || pub?.publicURL || '';
          if (url) uploadedUrls.push(url);
        }
      }

      if (external) uploadedUrls.push(external);

      const payload = {
        assignment_id: assignmentId,
        user_id: user.id,
        submission_text: text || null,
        submission_url: uploadedUrls.length ? JSON.stringify(uploadedUrls) : null,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('assignment_submissions').upsert(payload, { onConflict: ['assignment_id','user_id'] }).select().maybeSingle();
      if (error) throw error;

      statusEl.textContent = 'Submission saved.';
      // Redirect to assignment detail
      setTimeout(()=>{ location.href = '/TEMPLATES/FrameAssignmentDetail.html?id=' + encodeURIComponent(assignmentId); }, 700);

    }catch(err){
      console.error(err);
      statusEl.textContent = 'Submission failed: ' + (err.message || JSON.stringify(err));
    }finally{
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  });
});
