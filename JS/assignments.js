import { supabase } from './supabase-auth.js';

function fmtDate(d){ if (!d) return 'TBD'; return new Date(d).toLocaleString(); }

function renderAssignments(container, items){
  container.innerHTML = '';
  if (!items || items.length === 0){
    container.parentElement.innerHTML = `
      <div class="assignments-empty">
        <svg data-lucide="inbox"></svg>
        <h3>No assignments yet</h3>
        <p>Check back soon for new assignments from your instructors.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  items.forEach(a=>{
    const card = document.createElement('div');
    card.className = 'assignment-card';
    
    const status = (a.status || 'open').toLowerCase();
    const statusClass = status === 'closed' ? 'status-closed' : status === 'draft' ? 'status-draft' : 'status-open';
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    
    const dueDate = new Date(a.due_date);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    const isDueSoon = daysUntilDue <= 3 && daysUntilDue > 0;
    
    card.innerHTML = `
      <div class="assignment-header">
        <h3 class="assignment-title">${(a.title||'Untitled')}</h3>
        <span class="assignment-status ${statusClass}">${statusLabel}</span>
      </div>
      <div class="assignment-class">${(a.class_id ? 'Class: ' + (a.class_name || 'Unknown') : 'General Assignment')}</div>
      <div class="assignment-description">${(a.description||'No description provided').slice(0,120)}</div>
      <div class="assignment-meta">
        <div class="meta-item">
          <svg data-lucide="calendar" width="16" height="16"></svg>
          <span class="due-date ${isDueSoon ? 'due-soon' : ''}">${fmtDate(a.due_date)}</span>
        </div>
      </div>
      <div class="assignment-action">
        <button class="action-btn" onclick="window.location.href='/TEMPLATES/FrameAssignmentDetail.html?id=${encodeURIComponent(a.id)}'">
          <svg data-lucide="eye" width="14" height="14"></svg>
          View Details
        </button>
      </div>
    `;
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', async function(){
  let currentPage = 1; const perPage = 12;
  const params = new URLSearchParams(location.search);
  const classId = params.get('class_id') || params.get('id');
  const container = document.getElementById('assignmentsList');
  const pageInfo = document.getElementById('pageInfo');

  async function load(){
    const sort = document.getElementById('sortBy').value;
    const status = document.getElementById('filterStatus').value;
    const from = (currentPage-1)*perPage;
    try{
      // Query unified activities table for published activities
      let builder = supabase.from('activities').select('*').eq('is_published', true);
      
      if (classId) builder = builder.eq('class_id', classId);
      if (status) builder = builder.eq('status', status);
      
      if (sort === 'due_asc') builder = builder.order('due_date',{ascending:true});
      else if (sort === 'due_desc') builder = builder.order('due_date',{ascending:false});
      else if (sort === 'title') builder = builder.order('title',{ascending:true});
      
      const { data, error } = await builder.range(from, from + perPage - 1);
      if (error) throw error;
      
      // Fetch class names for all unique class_ids
      const classIds = [...new Set(data.map(a => a.class_id).filter(Boolean))];
      let classMap = {};
      if (classIds.length > 0) {
        const { data: classes, error: classError } = await supabase.from('classes').select('id, class_name').in('id', classIds);
        if (!classError && classes) {
          classMap = Object.fromEntries(classes.map(c => [c.id, c.class_name]));
        }
      }
      
      // Add class_name to activities
      const enrichedData = data.map(a => ({
        ...a,
        class_name: classMap[a.class_id] || 'Unknown'
      }));
      
      renderAssignments(container, enrichedData);
      pageInfo.textContent = currentPage;
      
      if (classId){
        const { data:cls } = await supabase.from('classes').select('class_name').eq('id', classId).maybeSingle();
        if (cls) document.getElementById('className').textContent = cls.class_name || 'Class';
      }
    }catch(e){ console.error(e); container.innerHTML = '<div class="p-4 text-red-600">Failed to load assignments</div>'; }
  }

  document.getElementById('sortBy').addEventListener('change', function(){ currentPage=1; load(); });
  document.getElementById('filterStatus').addEventListener('change', function(){ currentPage=1; load(); });
  document.getElementById('prevPage').addEventListener('click', function(){ if (currentPage>1){ currentPage--; load(); } });
  document.getElementById('nextPage').addEventListener('click', function(){ currentPage++; load(); });

  load();
});
