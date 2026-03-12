import { supabase } from './supabase-auth.js';

const classSelect = document.getElementById('classSelect');
const resourcesGrid = document.getElementById('resourcesGrid');
const emptyState = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn');

let userEnrolledClasses = [];
let allResources = [];
let currentFilter = 'all';

// Load student's enrolled classes
async function loadEnrolledClasses() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      window.location.href = '/TEMPLATES/FrameLogin.html';
      return;
    }
    
    // Fetch classes the user is enrolled in
    const { data: enrollments, error } = await supabase
      .from('class_enrollments')
      .select('class_id, classes(id, class_name)')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error loading classes:', error);
      return;
    }
    
    userEnrolledClasses = enrollments?.map(e => e.classes) || [];
    
    // Populate class dropdown
    if (userEnrolledClasses.length === 0) {
      classSelect.innerHTML = '<option value="">You are not enrolled in any classes</option>';
    } else {
      classSelect.innerHTML = '<option value="">-- Select a class --</option>';
      userEnrolledClasses.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.class_name;
        classSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// Load resources for selected class
async function loadResources() {
  const selectedClassId = classSelect.value;
  
  if (!selectedClassId) {
    resourcesGrid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  
  try {
    const { data: resources, error } = await supabase
      .from('class_resources')
      .select('*')
      .eq('class_id', selectedClassId)
      .order('display_order', { ascending: false });
    
    if (error) {
      console.error('Error loading resources:', error);
      return;
    }
    
    allResources = resources || [];
    renderResources();
  } catch (err) {
    console.error('Error:', err);
  }
}

// Render resources based on current filter
function renderResources() {
  const filteredResources = currentFilter === 'all' 
    ? allResources 
    : allResources.filter(r => r.resource_type === currentFilter);
  
  if (filteredResources.length === 0) {
    resourcesGrid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  resourcesGrid.innerHTML = filteredResources.map(resource => {
    const isImage = resource.resource_type === 'image' || resource.resource_url?.match(/\.(jpg|jpeg|png|gif|webp)/i);
    const uploadDate = new Date(resource.created_at).toLocaleDateString();
    const fileSize = resource.file_size ? formatFileSize(resource.file_size) : 'Unknown';
    
    return `
      <div class="resource-card">
        <div class="resource-card-image ${!isImage ? 'no-image' : ''}">
          ${isImage ? `<img src="${resource.resource_url}" alt="${escapeHTML(resource.title)}" onerror="this.style.display='none'">` : `<i data-lucide="file"></i>`}
        </div>
        <div class="resource-card-content">
          <div class="resource-card-title">${escapeHTML(resource.title)}</div>
          ${resource.description ? `<div class="resource-card-desc">${escapeHTML(resource.description)}</div>` : ''}
          <div class="resource-card-meta" style="margin-top: auto;">
            <span><i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${uploadDate}</span>
            ${fileSize !== 'Unknown' ? `<span><i data-lucide="hard-drive" style="width: 12px; height: 12px;"></i> ${fileSize}</span>` : ''}
          </div>
          <div class="resource-card-action">
            <a href="${resource.resource_url}" target="_blank" class="btn btn-primary" download>
              <i data-lucide="download" style="width: 16px; height: 16px;"></i>
              Download
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Escape HTML
function escapeHTML(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Event listeners
classSelect.addEventListener('change', loadResources);

filterButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    filterButtons.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderResources();
  });
});

// Initialize
loadEnrolledClasses();
