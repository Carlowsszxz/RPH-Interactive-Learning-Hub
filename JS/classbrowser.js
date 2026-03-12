import populateClasses from './classes-data.js';
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

function renderClassGrid(items, instructorsMap){
  var grid = document.getElementById('classesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!items || items.length === 0){ 
    grid.innerHTML = '<div class="no-results"><svg data-lucide="inbox"></svg><p>No classes found. Try adjusting your filters.</p></div>'; 
    return; 
  }
  items.forEach(function(it){
    var div = document.createElement('div');
    var subjectClass = getSubjectClass(it.category);
    var iconType = getSubjectIcon(it.category);
    var instructorName = (instructorsMap && instructorsMap[it.instructor]) ? instructorsMap[it.instructor] : 'Unknown';
    var studentCount = (it.students||0);
    
    div.className = 'class-card ' + subjectClass;
    div.innerHTML = `
      <div class="class-card-background"></div>
      <div class="class-card-overlay">
        <div class="class-icon">
          <i data-lucide="${iconType}"></i>
        </div>
      </div>
      <div class="class-card-title">${escapeHTML(it.title||'Untitled Class')}</div>
      <div class="class-card-meta">
        <span class="class-level-badge">${escapeHTML((it.level||'Intermediate').charAt(0).toUpperCase() + (it.level||'Intermediate').slice(1))}</span>
        <span class="class-students-badge">${studentCount} enrolled</span>
      </div>
      <div class="class-card-description">${escapeHTML(it.description||'Learn about this class')}</div>
      <div class="class-card-footer">
        <span class="class-instructor-badge">by ${escapeHTML(instructorName)}</span>
        <button class="class-card-btn enroll-quick">
          <i data-lucide="user-plus"></i>Enroll
        </button>
      </div>
    `;
    grid.appendChild(div);
    
    // Initialize lucide icons in the new card
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Add enroll click handler
    div.querySelector('.enroll-quick').addEventListener('click', function(){ 
      if (typeof handleEnroll === 'function') handleEnroll(it); 
      else alert('Enroll: ' + (it.title||'')); 
    });
    
    // Add card click to view details
    div.addEventListener('click', function(e){
      if (e.target.closest('.enroll-quick')) return;
      window.location.href = '/TEMPLATES/FrameClassDetail.html?id=' + encodeURIComponent(it.id);
    });
  });
}

function selectClass(item){
  document.getElementById('detailTitle').textContent = item.title || '';
  document.getElementById('detailDesc').textContent = item.description || '';
  document.getElementById('detailInstructor').textContent = item.instructor || '';
  document.getElementById('detailLevel').textContent = item.level || '';
  if (typeof handleClassSelect === 'function') handleClassSelect(item);
}

document.addEventListener('DOMContentLoaded', async function(){
  var currentPage = 1;
  var instructorsMap = {};

  async function loadInstructors(){
    try{
      const { data, error } = await supabase.from('user_profiles').select('id,full_name');
      if (!error && data){
        data.forEach(i=> instructorsMap[i.id]=i.full_name);
        var sel = document.getElementById('filterInstructor');
        if (sel){
          data.forEach(i=>{ var o = document.createElement('option'); o.value = i.id; o.textContent = i.full_name; sel.appendChild(o); });
        }
      }
    }catch(e){console.error(e)}
  }

  async function load(){
    var q = (document.getElementById('classSearch')||{}).value || '';
    var cat = (document.getElementById('filterCategory')||{}).value || '';
    var level = (document.getElementById('filterLevel')||{}).value || '';
    var instructor = (document.getElementById('filterInstructor')||{}).value || '';
    var sort = (document.getElementById('sortBy')||{}).value || 'created';

    // call populateClasses; it accepts instructor and sort now
    const items = await populateClasses({ q:q, category:cat, level:level, instructor: instructor || null, sort: sort, page: currentPage, limit: 12 });
    // Filter out the 'General' class
    const filteredItems = items.filter(it => it.class_code !== 'GENERAL');
    renderClassGrid(filteredItems, instructorsMap);
    document.getElementById('pageInfo').textContent = currentPage;
  }

  document.getElementById('classSearch').addEventListener('input', function(){ currentPage=1; load(); });
  document.getElementById('filterCategory').addEventListener('change', function(){ currentPage=1; load(); });
  document.getElementById('filterLevel').addEventListener('change', function(){ currentPage=1; load(); });
  document.getElementById('filterInstructor').addEventListener('change', function(){ currentPage=1; load(); });
  document.getElementById('sortBy').addEventListener('change', function(){ currentPage=1; load(); });

  document.getElementById('prevPage').addEventListener('click', function(){ if (currentPage>1) { currentPage--; load(); } });
  document.getElementById('nextPage').addEventListener('click', function(){ currentPage++; load(); });

  await loadInstructors();
  load();
});
