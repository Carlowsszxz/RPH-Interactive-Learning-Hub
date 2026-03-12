import { supabase } from './supabase-auth.js';

// Form elements
const uploadForm = document.getElementById('uploadForm');
const classSelect = document.getElementById('classSelect');
const topicSelect = document.getElementById('topicSelect');
const imageTitle = document.getElementById('imageTitle');
const imageDescription = document.getElementById('imageDescription');
const imageFile = document.getElementById('imageFile');
const uploadArea = document.getElementById('uploadArea');
const imagePreview = document.getElementById('imagePreview');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const successText = document.getElementById('successText');
const errorText = document.getElementById('errorText');
const resourcesList = document.getElementById('resourcesList');

let selectedFiles = [];
let allClasses = [];
let allTopics = [];

// Load instructor's classes
async function loadClasses() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) return;
    
    // Fetch all classes taught by this instructor
    const { data: classes, error } = await supabase
      .from('classes')
      .select('id, class_name')
      .eq('instructor_id', user.id)
      .order('class_name', { ascending: true });
    
    if (error) {
      console.error('Error loading classes:', error);
      showError('Failed to load classes. Please try again.');
      return;
    }
    
    allClasses = classes || [];
    
    // Populate class dropdown
    if (allClasses.length === 0) {
      classSelect.innerHTML = '<option value="">No classes available</option>';
      submitBtn.disabled = true;
    } else {
      classSelect.innerHTML = '<option value="">-- Select a class --</option>';
      allClasses.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.class_name;
        classSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error loading classes:', err);
    showError('Error loading classes: ' + err.message);
  }
}

// Load topics for selected class
async function loadTopics() {
  const selectedClassId = classSelect.value;
  
  if (!selectedClassId) {
    topicSelect.innerHTML = '<option value="">-- No specific topic --</option>';
    return;
  }
  
  try {
    const { data: topics, error } = await supabase
      .from('topics')
      .select('id, title')
      .eq('class_id', selectedClassId)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Error loading topics:', error);
      return;
    }
    
    allTopics = topics || [];
    
    topicSelect.innerHTML = '<option value="">-- No specific topic --</option>';
    allTopics.forEach(topic => {
      const option = document.createElement('option');
      option.value = topic.id;
      option.textContent = topic.title;
      topicSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading topics:', err);
  }
}

// Load resources for selected class
async function loadClassResources() {
  const selectedClassId = classSelect.value;
  
  if (!selectedClassId) {
    resourcesList.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="inbox"></i></div><p>Select a class to see resources</p></div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }
  
  try {
    const { data: resources, error } = await supabase
      .from('class_resources')
      .select('*')
      .eq('class_id', selectedClassId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading resources:', error);
      return;
    }
    
    if (!resources || resources.length === 0) {
      resourcesList.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="inbox"></i></div><p>No resources yet</p></div>';
    } else {
      resourcesList.innerHTML = resources.map(resource => `
        <div class="resource-item">
          <div class="resource-info">
            <div class="resource-title">${escapeHTML(resource.title)}</div>
            <div class="resource-meta">
              ${resource.description ? escapeHTML(resource.description) + ' • ' : ''}
              Uploaded ${new Date(resource.created_at).toLocaleDateString()}
            </div>
          </div>
          <div class="resource-actions">
            <a href="${resource.resource_url}" target="_blank" class="resource-btn" style="background: #dbeafe; color: #1e40af; text-decoration: none;">View</a>
            <button class="resource-btn delete-btn" onclick="deleteResource('${resource.id}', '${selectedClassId}')">Delete</button>
          </div>
        </div>
      `).join('');
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    console.error('Error loading resources:', err);
  }
}

// Show success message
function showSuccess(message) {
  successText.textContent = message;
  successMessage.classList.add('show');
  errorMessage.classList.remove('show');
  setTimeout(() => {
    successMessage.classList.remove('show');
  }, 5000);
}

// Show error message
function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.add('show');
  successMessage.classList.remove('show');
  setTimeout(() => {
    errorMessage.classList.remove('show');
  }, 5000);
}

// Handle file selection
function handleFileSelect(files) {
  selectedFiles = Array.from(files).filter(file => {
    if (!file.type.startsWith('image/')) {
      showError('Please select only image files');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError(`File "${file.name}" exceeds 5MB limit`);
      return false;
    }
    return true;
  });
  
  updatePreview();
}

// Update preview
function updatePreview() {
  imagePreview.innerHTML = selectedFiles.map((file, index) => `
    <div class="preview-item">
      <img src="${URL.createObjectURL(file)}" alt="${file.name}">
      <button type="button" class="remove-btn" onclick="removePreview(${index})">×</button>
    </div>
  `).join('');
}

// Remove preview
window.removePreview = function(index) {
  selectedFiles.splice(index, 1);
  updatePreview();
};

// Upload area interactions
uploadArea.addEventListener('click', () => imageFile.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  handleFileSelect(e.dataTransfer.files);
});

imageFile.addEventListener('change', (e) => {
  handleFileSelect(e.target.files);
});

// Submit form
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const selectedClassId = classSelect.value;
  const title = imageTitle.value.trim();
  const description = imageDescription.value.trim();
  
  // Validation
  if (!selectedClassId) {
    showError('Please select a class');
    return;
  }
  
  if (!title) {
    showError('Please enter a resource title');
    return;
  }
  
  if (selectedFiles.length === 0) {
    showError('Please select at least one image');
    return;
  }
  
  submitBtn.disabled = true;
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i data-lucide="loader"></i> Uploading...';
  
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      showError('User not authenticated');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      return;
    }
    
    const selectedTopicId = topicSelect.value || null;
    
    // Upload each file
    let uploadedCount = 0;
    for (const file of selectedFiles) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${selectedClassId}/${timestamp}_${randomStr}_${file.name}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        showError('Failed to upload ' + file.name);
        continue;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData?.publicUrl;
      
      // Save metadata to database
      const { error: dbError } = await supabase
        .from('class_resources')
        .insert([
          {
            class_id: selectedClassId,
            topic_id: selectedTopicId,
            title: `${title} - ${selectedFiles.length > 1 ? file.name : ''}`.trim(),
            description: description || null,
            resource_url: publicUrl,
            resource_type: 'image',
            file_size: file.size,
            uploaded_by: user.id,
            display_order: Date.now()
          }
        ]);
      
      if (dbError) {
        console.error('Database error:', dbError);
        showError('Failed to save resource metadata');
        continue;
      }
      
      uploadedCount++;
    }
    
    if (uploadedCount > 0) {
      showSuccess(`Successfully uploaded ${uploadedCount} image${uploadedCount > 1 ? 's' : ''}!`);
      
      // Reset form
      uploadForm.reset();
      selectedFiles = [];
      updatePreview();
      imageFile.value = '';
      
      // Reload resources list
      await loadClassResources();
    }
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  } catch (err) {
    console.error('Error:', err);
    showError('Error uploading images: ' + err.message);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// Delete resource
window.deleteResource = async function(resourceId, classId) {
  if (!confirm('Are you sure you want to delete this resource?')) return;
  
  try {
    // Get resource URL first to delete from storage
    const { data: resource, error: fetchError } = await supabase
      .from('class_resources')
      .select('resource_url')
      .eq('id', resourceId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('class_resources')
      .delete()
      .eq('id', resourceId);
    
    if (dbError) {
      showError('Failed to delete resource');
      return;
    }
    
    // Try to delete from storage (may not exist)
    if (resource?.resource_url) {
      const urlParts = resource.resource_url.split('/');
      const fileName = urlParts.slice(-2).join('/');
      await supabase.storage
        .from('images')
        .remove([fileName])
        .catch(err => console.log('Storage deletion skipped:', err.message));
    }
    
    showSuccess('Resource deleted successfully');
    await loadClassResources();
  } catch (err) {
    console.error('Error:', err);
    showError('Error deleting resource: ' + err.message);
  }
};

// Class selection change
classSelect.addEventListener('change', () => {
  loadTopics();
  loadClassResources();
});

// Initialize
loadClasses();

// Render lucide icons
setTimeout(() => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}, 100);

// Helper function
function escapeHTML(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
