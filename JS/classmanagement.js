import { supabase } from './supabase-auth.js';

// DOM elements
const createClassBtn = document.getElementById('btnCreateClass');
const createClassModal = document.getElementById('createClassModal');
const createClassForm = document.getElementById('createClassForm');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const classesContainer = document.getElementById('classesContainer');

let currentUser = null;
let instructorClasses = [];

// Initialize
async function init() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      window.location.href = '/TEMPLATES/FrameLogin.html';
      return;
    }
    
    currentUser = user;
    loadClasses();
  } catch (err) {
    console.error('Init error:', err);
  }
}

// Load instructor's classes
async function loadClasses() {
  try {
    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .eq('instructor_id', currentUser.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading classes:', error);
      classesContainer.innerHTML = '<div class="col-span-full text-center text-red-500">Failed to load classes</div>';
      return;
    }
    
    instructorClasses = classes || [];
    
    if (instructorClasses.length === 0) {
      classesContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-gray-500 mb-4">You haven't created any classes yet.</p>
          <button id="emptyStateBtn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Create Your First Class
          </button>
        </div>
      `;
      document.getElementById('emptyStateBtn').addEventListener('click', () => openCreateModal());
      return;
    }
    
    // Display classes
    classesContainer.innerHTML = '';
    for (const cls of instructorClasses) {
      const card = createClassCard(cls);
      classesContainer.appendChild(card);
    }
  } catch (err) {
    console.error('Error in loadClasses:', err);
  }
}

// Create class card element
function createClassCard(cls) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded shadow hover:shadow-lg transition p-6';
  
  // Generate color based on class id (deterministic)
  const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-pink-100', 'bg-yellow-100'];
  const colorIndex = cls.id.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  const enrollmentCount = cls.student_count || 0;
  const enrollmentStatus = enrollmentCount === 0 ? 
    '<span class="text-xs text-gray-500">No students yet</span>' : 
    `<span class="text-xs text-green-600 font-semibold">${enrollmentCount} student${enrollmentCount !== 1 ? 's' : ''}</span>`;
  
  card.innerHTML = `
    <div class="${bgColor} rounded p-3 mb-3 h-20 flex items-center">
      <div>
        <div class="font-bold text-lg text-gray-800">${cls.class_name}</div>
        <div class="text-xs text-gray-600">Code: <span class="font-mono font-bold">${cls.class_code}</span></div>
      </div>
    </div>
    
    <div class="mb-3">
      <p class="text-sm text-gray-600 line-clamp-2">${cls.description || 'No description'}</p>
    </div>
    
    <div class="flex items-center justify-between mb-4 py-2 border-t border-b">
      <div>
        ${enrollmentStatus}
      </div>
      <div class="text-xs text-gray-500">
        ${new Date(cls.created_at).toLocaleDateString()}
      </div>
    </div>
    
    <div class="flex gap-2">
      <a href="/TEMPLATES/FrameClassDetail.html?id=${encodeURIComponent(cls.id)}" class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 text-center transition">
        Open Class
      </a>
      <button class="px-3 py-2 bg-gray-100 text-sm rounded hover:bg-gray-200 transition deleteClassBtn" data-class-id="${cls.id}">
        Delete
      </button>
    </div>
  `;
  
  // Delete handler
  card.querySelector('.deleteClassBtn').addEventListener('click', () => deleteClass(cls.id, cls.class_name));
  
  return card;
}

// Modal control
function openCreateModal() {
  createClassModal.classList.remove('hidden');
  document.getElementById('className').focus();
}

function closeCreateModal() {
  createClassModal.classList.add('hidden');
  createClassForm.reset();
}

// Generate random class code
function generateClassCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create class
createClassForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('className').value.trim();
  const desc = document.getElementById('classDesc').value.trim();
  let code = document.getElementById('classCode').value.trim();
  
  if (!name) {
    alert('Class name is required');
    return;
  }
  
  // Auto-generate code if not provided
  if (!code) {
    code = generateClassCode();
  }
  
  try {
    const { data, error } = await supabase
      .from('classes')
      .insert([{
        class_name: name,
        description: desc || null,
        class_code: code.toUpperCase(),
        instructor_id: currentUser.id,
        status: 'active'
      }]);
    
    if (error) {
      console.error('Error creating class:', error);
      
      // Check if error is due to duplicate code
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        alert('This class code already exists. Please use a different code.');
      } else {
        alert('Failed to create class: ' + error.message);
      }
      return;
    }
    
    console.log('Class created:', data);
    alert(`Class created successfully! Code: ${code}`);
    closeCreateModal();
    loadClasses();
    
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('An unexpected error occurred');
  }
});

// Delete class
async function deleteClass(classId, className) {
  if (!confirm(`Are you sure you want to delete "${className}"? This cannot be undone.`)) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)
      .eq('instructor_id', currentUser.id);
    
    if (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class: ' + error.message);
      return;
    }
    
    console.log('Class deleted:', classId);
    alert('Class deleted successfully');
    loadClasses();
    
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('An unexpected error occurred');
  }
}

// Event listeners
createClassBtn.addEventListener('click', openCreateModal);
cancelCreateBtn.addEventListener('click', closeCreateModal);

// Close modal when clicking outside
createClassModal.addEventListener('click', (e) => {
  if (e.target === createClassModal) {
    closeCreateModal();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', init);
