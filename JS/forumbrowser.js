import { supabase } from './supabase-auth.js';

function fmtDate(d){ if (!d) return ''; return new Date(d).toLocaleString(); }

// Debounce helper to prevent excessive queries
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const params = new URLSearchParams(location.search);
  let classId = params.get('class_id') || null;
  const threadsList = document.getElementById('threadsList');
  const threadView = document.getElementById('threadView');
  const threadCount = document.getElementById('threadCount');
  const filterClass = document.getElementById('filterClass');
  const searchInput = document.getElementById('searchThreads');
  const btnNewThread = document.getElementById('btnNewThread');
  const newThreadArea = document.getElementById('newThreadArea');
  const newThreadClass = document.getElementById('newThreadClass');
  const newThreadTitle = document.getElementById('newThreadTitle');
  const newThreadBody = document.getElementById('newThreadBody');
  const createThreadBtn = document.getElementById('createThreadBtn');
  const cancelCreateThread = document.getElementById('cancelCreateThread');
  const createThreadStatus = document.getElementById('createThreadStatus');

  async function loadClasses(){
    try{
      const { data, error } = await supabase.from('classes').select('id,class_name').order('class_name');
      if (error) throw error;
      const classes = data || [];
      filterClass.innerHTML = '<option value="">All classes</option>';
      newThreadClass.innerHTML = '';
      classes.forEach(c=>{
        const opt = document.createElement('option'); opt.value=c.id; opt.textContent = c.class_name; filterClass.appendChild(opt);
        const opt2 = opt.cloneNode(true); newThreadClass.appendChild(opt2);
      });
      if (classId){ filterClass.value = classId; newThreadClass.value = classId; }
    }catch(e){ console.error('loadClasses', e); }
  }

  // Ensure a persistent "General" class + topic exists. Returns the class ID.
  async function ensureGeneralTopicExists(){
    try{
      // Try to find existing General class
      let cls = null;
      try{
        const { data: byCode } = await supabase.from('classes').select('id,class_name,class_code').eq('class_code','GENERAL').limit(1);
        if (byCode?.length) cls = byCode[0];
        else {
          const { data: byName } = await supabase.from('classes').select('id,class_name,class_code').ilike('class_name','General').limit(1);
          if (byName?.length) cls = byName[0];
        }
      }catch(se){ console.warn('Failed to fetch General class:', se?.message); }

      // If no General class exists, create it
      if (!cls){
        const uRes = await supabase.auth.getUser();
        const user = uRes?.data?.user || uRes?.user;
        if (!user) return null; // Can't create without auth

        const classPayload = { class_name: 'General', description: 'Global/general forum', class_code: 'GENERAL', instructor_id: user.id, status: 'active' };
        try{
          const { data: newCls, error: clsErr } = await supabase.from('classes').insert(classPayload).select().maybeSingle();
          if (clsErr){
            // Try to fetch if already exists (race condition)
            const { data: retry } = await supabase.from('classes').select('id,class_name,class_code').eq('class_code','GENERAL').limit(1);
            cls = retry?.[0];
          } else {
            cls = newCls;
          }
        }catch(ci){ console.warn('Failed to create General class:', ci?.message); }
      }

      return cls?.id || null;
    }catch(e){ console.error('ensureGeneralTopicExists unexpected error:', e?.message); return null; }
  }

  async function loadThreads(){
    threadsList.innerHTML = '<div class="p-4 text-sm text-gray-600">Loading threads...</div>';
    try{
      const q = searchInput.value.trim();
      let builder = supabase.from('forum_topics').select('*').order('updated_at',{ascending:false}).limit(200);
      if (filterClass.value) builder = builder.eq('class_id', filterClass.value);
      if (q) builder = builder.ilike('title', `%${q}%`);
      const { data, error } = await builder;
      if (error) throw error;
      const items = data || [];
      threadCount.textContent = items.length;
      if (!items.length){ threadsList.innerHTML = '<div class="p-4 text-sm text-gray-600">No threads found.</div>'; return; }

      // collect user ids for profiles
      const uids = [...new Set(items.map(it=>it.created_by).filter(Boolean))];
      let profiles = [];
      if (uids.length){ const { data: p } = await supabase.from('user_profiles').select('id,full_name,avatar_url').in('id', uids); profiles = p || []; }

      const classIds = [...new Set(items.map(it => it.class_id).filter(Boolean))];
      let classes = [];
      if (classIds.length) {
        const { data: clsData } = await supabase.from('classes').select('id,class_name').in('id', classIds);
        classes = clsData || [];
      }

      threadsList.innerHTML = '';
      items.forEach(t=>{
        const prof = profiles.find(p=>p.id===t.created_by) || {};
        const cls = classes.find(c => c.id === t.class_id) || {};
        const row = document.createElement('div');
        row.className = 'thread-item';
        // For now, show post_count as before (will refactor later to properly track replies)
        const replyCount = Math.max(0, (t.post_count||1) - 1);
        row.innerHTML = `
          <div class="thread-title">${t.title}</div>
          <div class="thread-meta">
            <span class="thread-meta-item">${prof.full_name || 'Anonymous'}</span>
            <span class="thread-meta-item">${fmtDate(t.created_at)}</span>
            <span class="thread-meta-item">${replyCount} reply(ies)</span>
          </div>
        `;
        row.addEventListener('click', ()=> openThread(t));
        threadsList.appendChild(row);
      });
      lucide.createIcons();

    }catch(e){ console.error('loadThreads', e); threadsList.innerHTML = '<div class="p-4 text-red-600">Failed to load threads.</div>'; }
  }

  async function openThread(thread){
    threadView.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: #7A5B47;">Loading posts...</div>';
    try{
      threadView.innerHTML = '';
      
      // Add thread header
      const header = document.createElement('div');
      header.className = 'thread-header';
      header.innerHTML = `
        <h2 class="thread-header-title">${thread.title}</h2>
        <div class="thread-header-meta">
          <span>Started ${fmtDate(thread.created_at)}</span>
        </div>
      `;
      threadView.appendChild(header);

      // Add posts container
      const postsContainer = document.createElement('div');
      postsContainer.className = 'posts-container';
      threadView.appendChild(postsContainer);

      // Get the original post (topic creator's initial post)
      const postsRes = await supabase.from('forum_posts').select('*').eq('topic_id', thread.id).limit(1);
      if (postsRes.error) throw postsRes.error;
      const originalPost = postsRes.data?.[0];
      if (!originalPost){ threadView.innerHTML = '<div style="padding: 1.5rem; color: #A0522D;">Original post not found.</div>'; return; }

      // Get replies to the original post
      const repliesRes = await supabase.from('forum_replies').select('*').eq('post_id', originalPost.id).order('created_at',{ascending:true});
      if (repliesRes.error) throw repliesRes.error;
      const replies = repliesRes.data || [];
      
      // Fetch all author profiles (original post + all replies)
      const uids = [...new Set([originalPost.author_id, ...replies.map(r=>r.author_id)].filter(Boolean))];
      let profiles = [];
      if (uids.length){ const { data: p } = await supabase.from('user_profiles').select('id,full_name,avatar_url').in('id', uids); profiles = p || []; }

      // Display original post
      const profOrig = profiles.find(x=>x.id===originalPost.author_id) || {};
      const origInitial = (profOrig.full_name || originalPost.author_id || 'A').charAt(0).toUpperCase();
      const origPost = document.createElement('div');
      origPost.className = 'post';
      origPost.innerHTML = `
        <div class="post-avatar">${origInitial}</div>
        <div class="post-content">
          <div class="post-header">
            <span class="post-author">${profOrig.full_name || originalPost.author_id}</span>
            <span class="post-time">${fmtDate(originalPost.created_at)}</span>
          </div>
          <div class="post-body">${originalPost.content || ''}</div>
        </div>
      `;
      postsContainer.appendChild(origPost);

      // Display replies
      replies.forEach(r=>{
        const prof = profiles.find(x=>x.id===r.author_id) || {};
        const initial = (prof.full_name || r.author_id || 'A').charAt(0).toUpperCase();
        const replyBlock = document.createElement('div');
        replyBlock.className = 'post';
        replyBlock.innerHTML = `
          <div class="post-avatar">${initial}</div>
          <div class="post-content">
            <div class="post-header">
              <span class="post-author">${prof.full_name || r.author_id}</span>
              <span class="post-time">${fmtDate(r.created_at)}</span>
            </div>
            <div class="post-body">${r.content || ''}</div>
          </div>
        `;
        postsContainer.appendChild(replyBlock);
      });
      lucide.createIcons();

      // reply form
      const replyArea = document.createElement('div');
      replyArea.className = 'reply-form';
      replyArea.innerHTML = `
        <textarea id="replyBody" rows="4" class="reply-textarea" placeholder="Write a reply..."></textarea>
        <div class="reply-buttons">
          <button id="submitReply" class="btn-primary">
            <i data-lucide="send"></i>
            Post Reply
          </button>
        </div>
        <div id="replyStatus" class="status-message"></div>
      `;
      postsContainer.parentElement.appendChild(replyArea);
      lucide.createIcons();

      // Set up reply submission
      const btnReplyForm = document.getElementById('submitReply');
      btnReplyForm.addEventListener('click', async ()=>{
        const body = document.getElementById('replyBody').value.trim();
        const statusEl = document.getElementById('replyStatus');
        statusEl.textContent = '';
        statusEl.classList.remove('success', 'error');
        if (!body){ 
          statusEl.textContent = 'Please enter a message.';
          statusEl.classList.add('error');
          return; 
        }
        try{
          const userRes = await supabase.auth.getUser();
          const user = userRes?.data?.user || userRes?.user;
          if (!user){ 
            statusEl.textContent = 'You must be signed in to post.';
            statusEl.classList.add('error');
            return; 
          }
          // Insert reply into forum_replies
          const payload = { post_id: originalPost.id, author_id: user.id, content: body, created_at: new Date().toISOString() };
          const { error: rErr } = await supabase.from('forum_replies').insert(payload);
          if (rErr) throw rErr;
          // Increment post_count and update timestamp
          const { error: updateErr } = await supabase.from('forum_topics').update({ 
            post_count: (thread.post_count||1) + 1,
            updated_at: new Date().toISOString() 
          }).eq('id', thread.id);
          if (updateErr) console.warn('Failed to update timestamp:', updateErr);
          statusEl.textContent = 'Reply posted successfully.';
          statusEl.classList.add('success');
          document.getElementById('replyBody').value = '';
          // Reload thread and list to show new reply
          setTimeout(() => {
            openThread(thread);
            loadThreads();
          }, 1000);
        }catch(e){ 
          console.error('reply error', e);
          statusEl.textContent = 'Failed to post reply.';
          statusEl.classList.add('error');
        }
      });

    }catch(e){ 
      console.error('openThread', e);
      threadView.innerHTML = '<div style="padding: 1.5rem; color: #A0522D;">Failed to load thread.</div>';
    }
  }

  btnNewThread.addEventListener('click', ()=>{ 
    newThreadArea.classList.remove('hidden');
  });
  
  const cancelCreateThreadBtn = document.getElementById('cancelCreateThread');
  const cancelCreateThreadFooter = document.getElementById('cancelCreateThread-footer');
  
  function closeThreadModal() {
    newThreadArea.classList.add('hidden');
    createThreadStatus.textContent = '';
    createThreadStatus.classList.remove('success', 'error');
  }
  
  if (cancelCreateThreadBtn) {
    cancelCreateThreadBtn.addEventListener('click', closeThreadModal);
  }
  if (cancelCreateThreadFooter) {
    cancelCreateThreadFooter.addEventListener('click', closeThreadModal);
  }

  createThreadBtn.addEventListener('click', async ()=>{
    createThreadStatus.textContent = '';
    createThreadStatus.classList.remove('success', 'error');
    const title = newThreadTitle.value.trim();
    const body = newThreadBody.value.trim();
    const cls = newThreadClass.value || null;
    if (!title || !body){ 
      createThreadStatus.textContent = 'Title and message required.';
      createThreadStatus.classList.add('error');
      return; 
    }
    try{
      const uRes = await supabase.auth.getUser(); const user = uRes?.data?.user || uRes?.user;
      if (!user){ 
        createThreadStatus.textContent = 'Sign in to create threads.';
        createThreadStatus.classList.add('error');
        return; 
      }
      const threadPayload = { class_id: cls, title, description: body, created_by: user.id, created_at: new Date().toISOString(), post_count: 1 };
      const { data: tData, error: tErr } = await supabase.from('forum_topics').insert(threadPayload).select().maybeSingle();
      if (tErr) throw tErr;
      const threadId = tData.id;
      // create initial post
      await supabase.from('forum_posts').insert({ topic_id: threadId, author_id: user.id, content: body, created_at: new Date().toISOString() });
      createThreadStatus.textContent = 'Thread created successfully.';
      createThreadStatus.classList.add('success');
      newThreadTitle.value = ''; newThreadBody.value = '';
      setTimeout(() => {
        closeThreadModal();
        loadThreads();
        openThread(tData);
      }, 1000);
    }catch(e){ 
      console.error('createThread', e); 
      createThreadStatus.textContent = 'Failed to create thread.';
      createThreadStatus.classList.add('error');
    }
  });

  // event handlers with debouncing on search to prevent excessive queries
  filterClass.addEventListener('change', ()=> loadThreads());
  searchInput.addEventListener('input', debounce(()=> loadThreads(), 500));

  // initial load: ensure General class exists, set as default if no class_id param, then load
  const generalClassId = await ensureGeneralTopicExists();
  if (!classId && generalClassId) {
    classId = generalClassId; // Auto-select General
  }
  await loadClasses();
  if (classId){ filterClass.value = classId; }
  await loadThreads();
  lucide.createIcons();
});
