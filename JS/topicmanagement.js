import { supabase } from './supabase-auth.js';

// DOM elements
const classFilter = document.getElementById('classFilter');
const topicsContainer = document.getElementById('topicsContainer');
const emptyState = document.getElementById('emptyState');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const successText = document.getElementById('successText');
const errorText = document.getElementById('errorText');

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
    
    // Populate class filter dropdown
    if (allClasses.length > 0) {
      classFilter.innerHTML = '<option value="">-- All Classes --</option>';
      allClasses.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.class_name;
        classFilter.appendChild(option);
      });
    }
    
    // Load all topics
    await loadAllTopics();
  } catch (err) {
    console.error('Error loading classes:', err);
    showError('Error loading classes: ' + err.message);
  }
}

// Load all topics for instructor's classes
async function loadAllTopics() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) return;
    
    // Get all class IDs for this instructor
    const classIds = allClasses.map(c => c.id);
    if (classIds.length === 0) {
      allTopics = [];
      renderTopics();
      return;
    }
    
    // Fetch topics from all instructor's classes
    const { data: topics, error } = await supabase
      .from('topics')
      .select(`
        id,
        class_id,
        title,
        description,
        display_order,
        created_at,
        classes!inner(class_name)
      `)
      .in('class_id', classIds)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading topics:', error);
      return;
    }
    
    // Fetch all resources for these topics
    const topicIds = (topics || []).map(t => t.id);
    let resources = [];
    if (topicIds.length > 0) {
      const { data: resourcesData } = await supabase
        .from('class_resources')
        .select('id, topic_id, title, description, resource_url, resource_type, created_at')
        .in('topic_id', topicIds)
        .order('created_at', { ascending: false });
      resources = resourcesData || [];
    }
    
    // Attach resources to topics
    allTopics = (topics || []).map(topic => ({
      ...topic,
      resources: resources.filter(r => r.topic_id === topic.id)
    }));
    
    renderTopics();
  } catch (err) {
    console.error('Error loading topics:', err);
  }
}

// Render topics based on filter
function renderTopics() {
  const selectedClass = classFilter.value;
  
  // Filter topics
  let filteredTopics = allTopics;
  if (selectedClass) {
    filteredTopics = allTopics.filter(t => t.class_id === selectedClass);
  }
  
  // Show/hide empty state
  if (filteredTopics.length === 0) {
    topicsContainer.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  
  // Render topic cards
  topicsContainer.innerHTML = filteredTopics.map(topic => `
    <div class="topic-card">
      <div class="topic-header">
        <div class="topic-icon">
          <i data-lucide="bookmark" style="width: 20px; height: 20px;"></i>
        </div>
        <h3 class="topic-title">${escapeHTML(topic.title)}</h3>
      </div>
      
      ${topic.description ? `<div class="topic-description">${escapeHTML(topic.description)}</div>` : ''}
      
      <div class="topic-meta">
        <strong>Class:</strong> ${escapeHTML(topic.classes?.class_name || 'Unknown')} •
        <strong>Created:</strong> ${new Date(topic.created_at).toLocaleDateString()}
      </div>
      
      ${topic.resources && topic.resources.length > 0 ? `
        <div class="topic-resources-section" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
          <div style="font-size: 0.875rem; font-weight: 600; color: #2d3748; margin-bottom: 0.75rem;">Resources (${topic.resources.length})</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.75rem;">
            ${topic.resources.map(res => `
              <div style="background: #f9fafb; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem; text-align: center;">
                ${res.resource_type === 'image' ? `
                  <img src="${escapeHTML(res.resource_url)}" alt="${escapeHTML(res.title)}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px; margin-bottom: 0.5rem;">
                ` : `
                  <div style="width: 100%; height: 80px; display: flex; align-items: center; justify-content: center; color: #667eea; margin-bottom: 0.5rem;">
                    <i data-lucide="file-text" style="width: 24px; height: 24px;"></i>
                  </div>
                `}
                <div style="font-size: 0.75rem; color: #718096; margin-bottom: 0.5rem; word-break: break-word;">
                  ${escapeHTML(res.title)}
                </div>
                <button onclick="editResourceCaption('${res.id}', '${escapeHTML(res.description || '')}', '${topic.id}')" style="width: 100%; padding: 0.25rem; background: #dbeafe; color: #1e40af; border: none; border-radius: 4px; font-size: 0.7rem; cursor: pointer; margin-bottom: 0.25rem;">Edit Caption</button>
                <button onclick="deleteResource('${res.id}', '${topic.id}')" style="width: 100%; padding: 0.25rem; background: #fee2e2; color: #991b1b; border: none; border-radius: 4px; font-size: 0.7rem; cursor: pointer;">Delete</button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="topic-actions">
        <button class="btn btn-edit" onclick="editTopic('${topic.id}')">
          <i data-lucide="edit-2" style="width: 16px; height: 16px;"></i>
          Edit Topic
        </button>
        <button class="btn btn-delete" onclick="deleteTopic('${topic.id}', '${escapeHTML(topic.title)}')">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
          Delete
        </button>
      </div>
    </div>
  `).join('');
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
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

// Delete topic
window.deleteTopic = async function(topicId, topicTitle) {
  if (!confirm(`Are you sure you want to delete the topic "${topicTitle}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    // Delete the topic
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', topicId);
    
    if (error) {
      console.error('Delete error:', error);
      showError('Failed to delete topic: ' + error.message);
      return;
    }
    
    showSuccess('Topic deleted successfully');
    
    // Reload topics
    await loadAllTopics();
  } catch (err) {
    console.error('Error deleting topic:', err);
    showError('Error deleting topic: ' + err.message);
  }
};

// Edit topic (redirect to edit page)
window.editTopic = async function(topicId) {
  try {
    // Fetch the topic to get its class_id
    const { data: topic, error } = await supabase
      .from('topics')
      .select('class_id')
      .eq('id', topicId)
      .single();
    
    if (error || !topic) {
      showError('Failed to load topic');
      return;
    }
    
    // Redirect to edit page with both topic and class IDs
    window.location.href = `/TEMPLATES/FrameTopicEdit.html?topic=${topicId}&class=${topic.class_id}`;
  } catch (err) {
    console.error('Error loading topic:', err);
    showError('Error loading topic: ' + err.message);
  }
};

// Edit resource caption
window.editResourceCaption = async function(resourceId, currentCaption, topicId) {
  const newCaption = prompt('Edit image caption:', currentCaption);
  if (newCaption === null) return; // User cancelled
  
  try {
    const { error } = await supabase
      .from('class_resources')
      .update({ description: newCaption })
      .eq('id', resourceId);
    
    if (error) {
      console.error('Update error:', error);
      showError('Failed to update caption: ' + error.message);
      return;
    }
    
    showSuccess('Caption updated successfully');
    await loadAllTopics();
  } catch (err) {
    console.error('Error updating caption:', err);
    showError('Error updating caption: ' + err.message);
  }
};

// Delete resource
window.deleteResource = async function(resourceId, topicId) {
  if (!confirm('Are you sure you want to delete this image?')) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('class_resources')
      .delete()
      .eq('id', resourceId);
    
    if (error) {
      console.error('Delete error:', error);
      showError('Failed to delete image: ' + error.message);
      return;
    }
    
    showSuccess('Image deleted successfully');
    await loadAllTopics();
  } catch (err) {
    console.error('Error deleting image:', err);
    showError('Error deleting image: ' + err.message);
  }
};

// Class filter change
classFilter.addEventListener('change', renderTopics);

// Initialize
loadClasses();

// Render lucide icons
setTimeout(() => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}, 100);

// Helper function to escape HTML
function escapeHTML(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
