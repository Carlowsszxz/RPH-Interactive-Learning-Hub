import { supabase } from './supabase-auth.js';

function fmtDate(d){ if (!d) return ''; return new Date(d).toLocaleString(); }

function getInitial(name) {
  if (!name) return 'U';
  return name.trim().charAt(0).toUpperCase();
}

function setMsg(el, text, isError = false) {
  if (!el) return;
  el.textContent = text;
  el.classList.remove('success', 'error');
  if (isError) {
    el.classList.add('error');
  } else if (text.includes('✓') || text.includes('successful')) {
    el.classList.add('success');
  }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const promptList = document.getElementById('promptList');
  const promptView = document.getElementById('promptView');
  const btnNewPrompt = document.getElementById('btnNewPrompt');
  const newPromptModal = document.getElementById('newPromptModal');
  const createPromptBtn = document.getElementById('createPromptBtn');
  const cancelCreatePrompt = document.getElementById('cancelCreatePrompt');
  const createPromptStatus = document.getElementById('createPromptStatus');

  // Check if opened from FrameActivities with specific activity ID
  const urlParams = new URLSearchParams(window.location.search);
  const activityId = urlParams.get('id');
  
  // Hide "New Prompt" button if viewing a specific activity
  if (activityId) {
    btnNewPrompt.style.display = 'none';
  }

  async function loadPrompts(){
    promptList.innerHTML = '<div class="text-sm text-gray-600 p-3">Loading prompts...</div>';
    try{
      // If activity ID provided, load from activities table
      if (activityId) {
        const { data: activity, error: actError } = await supabase
          .from('activities')
          .select('*')
          .eq('id', activityId)
          .eq('activity_type', 'reflection')
          .single();
        
        if (actError) throw actError;
        if (!activity) {
          promptList.innerHTML = '<div class="text-sm text-red-600 p-3">Reflection not found</div>';
          return;
        }
        
        promptList.innerHTML = '';
        const div = document.createElement('div'); 
        div.className='prompt-item';
        div.innerHTML = `<div class="font-semibold">${activity.title}</div><div class="text-xs text-gray-500">${fmtDate(activity.created_at)}</div>`;
        div.addEventListener('click', ()=> openActivityPrompt(activity));
        promptList.appendChild(div);
        
        // Auto-open the reflection
        openActivityPrompt(activity);
      } else {
        // Fallback: Load from reflection_prompts table
        const { data, error } = await supabase.from('reflection_prompts')
          .select('*')
          .order('created_at',{ascending:false});
        if (error) throw error;
        const items = data || [];
        promptList.innerHTML = '';
        if (!items.length) promptList.innerHTML = '<div class="text-sm text-gray-600 p-3">No prompts.</div>';
        items.forEach(p=>{
          const div = document.createElement('div'); 
          div.className='prompt-item';
          div.innerHTML = `<div class="font-semibold">${p.title}</div><div class="text-xs text-gray-500">${fmtDate(p.created_at)}</div>`;
          div.addEventListener('click', ()=> openPrompt(p));
          promptList.appendChild(div);
        });
      }
    }catch(e){ console.error('loadPrompts', e); promptList.innerHTML = '<div class="text-sm text-red-600 p-3">Failed to load prompts: ' + e.message + '</div>' }
  }

  // Handle reflections from activities table
  async function openActivityPrompt(activity){
    promptView.innerHTML = '<div class="p-3 text-sm text-gray-600">Loading...</div>';
    try{
      // Fetch submissions for this activity reflection
      const { data: submissionData } = await supabase
        .from('activity_submissions')
        .select('*')
        .eq('activity_id', activity.id)
        .order('created_at',{ascending:false});
      
      let submissions = submissionData || [];
      
      // Enrich submissions with user profile data
      submissions = await Promise.all((submissions || []).map(async (s) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', s.user_id)
          .single();
        return { ...s, user_profiles: profile };
      }));
      
      // Get current user's submission if exists
      const userRes = await supabase.auth.getUser();
      const currentUser = userRes?.data?.user || userRes?.user;
      const userSubmission = currentUser ? submissions.find(s => s.user_id === currentUser.id) : null;
      
      // Clear view and build new content
      promptView.innerHTML = '';
      
      // 1. Prompt Header
      const head = document.createElement('div'); 
      head.className='prompt-detail-header';
      head.innerHTML = `<div class="prompt-detail-title">${activity.title}</div><div style="color: var(--text-secondary);">${activity.prompt || activity.description || ''}</div>`;
      promptView.appendChild(head);

      // 2. Submission Area - PROMINENT
      const submitArea = document.createElement('div'); 
      submitArea.className='reflection-form';
      
      // Build the label with submission status if exists
      let labelHtml = `<label class="reflection-form-title">Your Reflection Answer`;
      if (userSubmission) {
        labelHtml += ` <span style="font-size: 12px; font-weight: normal; color: var(--success);">(Last submitted: ${fmtDate(userSubmission.submitted_at)})</span>`;
      }
      labelHtml += `</label>`;
      
      submitArea.innerHTML = labelHtml + `<textarea id="reflectionBody" rows="6" placeholder="Type your reflection here..." class="response-textarea"></textarea><div class="form-actions"><button id="cancelReflectionBtn" class="btn-secondary">Clear</button><button id="submitReflectionBtn" class="btn-primary">Submit</button></div><div id="submitReflectionStatus" class="status-message"></div>`;
      
      // Set textarea value after creating element
      const textareaEl = submitArea.querySelector('textarea');
      if (userSubmission && userSubmission.submission_text) {
        textareaEl.value = userSubmission.submission_text;
      }
      
      // Show status badge
      if (userSubmission) {
        const statusBadge = document.createElement('div');
        statusBadge.className='status-message success';
        statusBadge.textContent = `✓ Status: ${userSubmission.status.toUpperCase()}${userSubmission.score !== null ? ` | Score: ${userSubmission.score}/${activity.points || 100}` : ''}${userSubmission.grade_letter ? ` | Grade: ${userSubmission.grade_letter}` : ''}`;
        submitArea.appendChild(statusBadge);
      }
      
      promptView.appendChild(submitArea);

      // 3. Other Submissions Section
      const listHeader = document.createElement('div');
      listHeader.className = 'prompt-detail-title' ;
      listHeader.style.marginTop = '32px';
      listHeader.style.marginBottom = '16px';
      listHeader.style.paddingTop = '16px';
      listHeader.style.borderTop = '1px solid var(--border-color)';
      listHeader.textContent = 'Reflections from Others';
      promptView.appendChild(listHeader);

      const list = document.createElement('div'); 
      list.className='space-y-3';
      const otherSubmissions = submissions.filter(s => !currentUser || s.user_id !== currentUser.id);
      if (!otherSubmissions || !otherSubmissions.length) {
        list.innerHTML = '<div class="text-sm text-gray-600 p-4 bg-gray-50 rounded">No other reflections yet. Be the first to share!</div>';
      } else {
        otherSubmissions.forEach(s=>{
          const user = (s.user_profiles && (s.user_profiles.full_name || '')) || 'Anonymous';
          const box = document.createElement('div'); 
          box.className='p-3 border rounded bg-gray-50';
          box.innerHTML = `<div class="font-semibold text-sm">${user}</div><div class="text-xs text-gray-500">${fmtDate(s.created_at)}</div><div class="mt-2 text-sm text-gray-800">${s.submission_text || s.submission_urls || ''}</div>`; 
          list.appendChild(box);
        });
      }
      promptView.appendChild(list);

      // Setup Submit Button
      document.getElementById('submitReflectionBtn').addEventListener('click', async ()=>{
        const statusEl = document.getElementById('submitReflectionStatus'); 
        setMsg(statusEl, 'Submitting...');
        
        const content = document.getElementById('reflectionBody').value.trim();
        if (!content){ 
          setMsg(statusEl, 'Please enter your reflection.', true);
          return; 
        }
        try{
          const userRes = await supabase.auth.getUser(); 
          const user = userRes?.data?.user || userRes?.user;
          if (!user){ 
            setMsg(statusEl, 'Sign in to submit.', true);
            return; 
          }
          
          const payload = { 
            activity_id: activity.id, 
            user_id: user.id, 
            submission_text: content, 
            status: 'submitted',
            attempt_number: 1,
            submitted_at: new Date().toISOString()
          };
          
          // Upsert submission using correct constraint (activity_id, user_id, attempt_number)
          const { data: result, error } = await supabase
            .from('activity_submissions')
            .upsert(payload, { onConflict: 'activity_id,user_id,attempt_number' })
            .select()
            .maybeSingle();
          
          if (error) throw error;
          setMsg(statusEl, '✓ Reflection submitted successfully!');
          
          setTimeout(() => openActivityPrompt(activity), 1500);
        }catch(e){ 
          setMsg(statusEl, 'Failed to submit: ' + (e.message || 'Unknown error'), true);
        }
      });

      document.getElementById('cancelReflectionBtn').addEventListener('click', ()=>{ 
        document.getElementById('reflectionBody').value=''; 
      });

    }catch(e){ 
      console.error('openActivityPrompt', e); 
      promptView.innerHTML = '<div class="p-3 text-red-600">Failed to load reflection: ' + (e.message || 'Unknown error') + '</div>' 
    }
  }

  async function openPrompt(p){
    promptView.innerHTML = '<div class="p-3 text-sm text-gray-600">Loading...</div>';
    try{
      // Fetch reflections for this prompt with user profile info
      const { data: reflectionData } = await supabase
        .from('user_reflections')
        .select('*, user_id')
        .eq('prompt_id', p.id)
        .order('created_at',{ascending:false});
      
      // Enrich with user profile data
      let reflections = [];
      if (reflectionData) {
        const enriched = await Promise.all(reflectionData.map(async (r) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, avatar_url')
            .eq('id', r.user_id)
            .single();
          return { ...r, user: profile };
        }));
        reflections = enriched;
      }
      
      // Clear view and build new content
      promptView.innerHTML = '';
      
      // 1. Prompt Header
      const head = document.createElement('div'); 
      head.className='prompt-detail-header';
      head.innerHTML = `<div class="prompt-detail-title">${p.title}</div><div style="color: var(--text-secondary);">${p.prompt || p.description || ''}</div>`;
      promptView.appendChild(head);

      // 2. Submission Area - PROMINENT
      const submitArea = document.createElement('div'); 
      submitArea.className='reflection-form';
      submitArea.innerHTML = `<label class="reflection-form-title">Your Reflection Answer</label><textarea id="reflectionBody" rows="6" placeholder="Type your reflection here..." class="response-textarea"></textarea><div class="form-actions"><button id="cancelReflectionBtn" class="btn-secondary">Clear</button><button id="submitReflectionBtn" class="btn-primary">Submit</button></div><div id="submitReflectionStatus" class="status-message"></div>`;
      promptView.appendChild(submitArea);

      // 3. Other Reflections Section
      const listHeader = document.createElement('div');
      listHeader.className = 'prompt-detail-title';
      listHeader.style.marginTop = '32px';
      listHeader.style.marginBottom = '16px';
      listHeader.style.paddingTop = '16px';
      listHeader.style.borderTop = '1px solid var(--border-color)';
      listHeader.textContent = 'Reflections from Others';
      promptView.appendChild(listHeader);

      const list = document.createElement('div'); 
      list.className='space-y-3';
      if (!reflections || !reflections.length) {
        list.innerHTML = '<div class="text-sm text-gray-600 p-4 bg-gray-50 rounded">No other reflections yet. Be the first to share!</div>';
      } else {
        reflections.forEach(r=>{
          const user = (r.user && (r.user.full_name || '')) || 'Anonymous';
          const box = document.createElement('div'); 
          box.className='p-3 border rounded bg-gray-50';
          box.innerHTML = `<div class="font-semibold text-sm">${user}</div><div class="text-xs text-gray-500">${fmtDate(r.created_at)}</div><div class="mt-2 text-sm text-gray-800">${r.content}</div>`; 
          list.appendChild(box);
        });
      }
      promptView.appendChild(list);

      // Setup Submit Button
      document.getElementById('submitReflectionBtn').addEventListener('click', async ()=>{
        const statusEl = document.getElementById('submitReflectionStatus'); 
        setMsg(statusEl, 'Submitting...');
        
        const content = document.getElementById('reflectionBody').value.trim();
        if (!content){ 
          setMsg(statusEl, 'Please enter your reflection.', true);
          return; 
        }
        try{
          const userRes = await supabase.auth.getUser(); 
          const user = userRes?.data?.user || userRes?.user;
          if (!user){ 
            setMsg(statusEl, 'Sign in to submit.', true);
            return; 
          }
          
          const payload = { 
            prompt_id: p.id, 
            user_id: user.id, 
            content, 
            word_count: content.split(/\s+/).length, 
            is_completed: true, 
            created_at: new Date().toISOString() 
          };
          
          const { data: result, error } = await supabase
            .from('user_reflections')
            .upsert(payload, { onConflict: 'user_id,prompt_id' })
            .select()
            .maybeSingle();
          
          if (error) throw error;
          setMsg(statusEl, '✓ Reflection submitted successfully!');
          document.getElementById('reflectionBody').value='';
          
          setTimeout(() => openPrompt(p), 1500);
        }catch(e){ 
          setMsg(statusEl, 'Failed to submit: ' + (e.message || 'Unknown error'), true);
        }
      });

      document.getElementById('cancelReflectionBtn').addEventListener('click', ()=>{ 
        document.getElementById('reflectionBody').value=''; 
      });

    }catch(e){ 
      console.error('openPrompt', e); 
      promptView.innerHTML = '<div class="p-3 text-red-600">Failed to load prompt: ' + (e.message || 'Unknown error') + '</div>' 
    }
  }

  btnNewPrompt.addEventListener('click', ()=>{ newPromptModal.classList.remove('hidden'); });
  cancelCreatePrompt.addEventListener('click', ()=>{ newPromptModal.classList.add('hidden'); createPromptStatus.textContent=''; });

  createPromptBtn.addEventListener('click', async ()=>{
    createPromptStatus.textContent = '';
    const title = document.getElementById('promptTitle').value.trim();
    const body = document.getElementById('promptBody').value.trim();
    if (!title || !body){ 
      setMsg(createPromptStatus, 'Title and prompt required.', true);
      return; 
    }
    try{
      const userRes = await supabase.auth.getUser(); 
      const user = userRes?.data?.user || userRes?.user;
      if (!user){ 
        setMsg(createPromptStatus, 'Sign in to create prompts.', true);
        return; 
      }
      // Insert into reflection_prompts table
      const payload = { title, prompt: body, created_by: user.id, created_at: new Date().toISOString() };
      const { data, error } = await supabase.from('reflection_prompts').insert(payload).select().maybeSingle();
      if (error) throw error;
      setMsg(createPromptStatus, '✓ Prompt created.');
      document.getElementById('promptTitle').value=''; 
      document.getElementById('promptBody').value='';
      newPromptModal.classList.add('hidden');
      loadPrompts();
    }catch(e){ 
      setMsg(createPromptStatus, 'Failed to create prompt: ' + (e.message || 'Unknown error'), true);
    }
  });

  // initial load
  loadPrompts();
  lucide.createIcons();
});
