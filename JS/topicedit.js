import { supabase } from './supabase-auth.js';

let topicId = null;
let classId = null;
let selectedFiles = [];
let existingImages = [];

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  topicId = params.get('topic');
  classId = params.get('class');

  if (!topicId || !classId) {
    showError('Missing topic ID or class ID');
    return;
  }

  // Load topic data and existing images
  await loadTopicData();

  // Setup file upload handlers
  setupFileUpload();

  // Setup form submission
  document.getElementById('topicForm').addEventListener('submit', handleFormSubmit);
});

async function loadTopicData() {
  try {
    console.log('Loading topic:', topicId, 'for class:', classId);
    
    // Fetch topic
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      console.error('Topic error:', topicError);
      showError('Topic not found');
      return;
    }

    console.log('Topic loaded:', topic);

    // Populate form fields
    document.getElementById('topicTitle').value = topic.title || '';
    document.getElementById('topicDescription').value = topic.description || '';
    document.getElementById('topicContent').value = topic.content || '';
    document.getElementById('displayOrder').value = topic.display_order || '';

    // First try: Fetch existing images/resources with topic_id
    const { data: resources, error: resourcesError } = await supabase
      .from('class_resources')
      .select('*')
      .eq('topic_id', topicId)
      .order('display_order', { ascending: true });

    if (resourcesError) {
      console.error('Error loading resources:', resourcesError);
      return;
    }

    console.log('Resources fetched (with topic_id filter):', resources);
    
    // DEBUG: Also fetch ALL resources for this class to see if images exist
    const { data: allResources } = await supabase
      .from('class_resources')
      .select('*')
      .eq('class_id', classId)
      .order('display_order', { ascending: true });
    
    console.log('ALL resources for this class (DEBUG):', allResources);
    
    existingImages = resources || [];
    console.log('Existing images count:', existingImages.length);
    
    renderExistingImages();
  } catch (error) {
    console.error('Error in loadTopicData:', error);
    showError('Error loading topic: ' + error.message);
  }
}

function renderExistingImages() {
  const container = document.getElementById('existingImagesContainer');

  if (existingImages.length === 0) {
    container.innerHTML = '<p style="color: #a0aec0; text-align: center;">No images added yet</p>';
    return;
  }

  container.innerHTML = `<div class="existing-images">
    ${existingImages
      .map((img) => `
        <div class="existing-image-item">
          <img src="${img.resource_url}" alt="${img.title}" class="existing-image-pic">
          <div class="existing-image-actions">
            <div class="existing-image-caption${!img.description ? '-empty' : ''}">
              ${img.description || 'No caption'}
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="edit-caption-btn" onclick="editCaption('${img.id}', '${escapeQuotes(img.description || '')}')">
                Edit
              </button>
              <button type="button" class="delete-image-btn" onclick="deleteImage('${img.id}')">
                Delete
              </button>
            </div>
          </div>
        </div>
      `)
      .join('')}
  </div>`;

  // Re-initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

window.editCaption = async function (resourceId, currentCaption) {
  const newCaption = prompt('Edit caption:', currentCaption);
  if (newCaption === null) return;

  try {
    const { error } = await supabase
      .from('class_resources')
      .update({ description: newCaption })
      .eq('id', resourceId);

    if (error) {
      showError('Error updating caption: ' + error.message);
      return;
    }

    // Update local array
    const resourceIdx = existingImages.findIndex((r) => r.id === resourceId);
    if (resourceIdx !== -1) {
      existingImages[resourceIdx].description = newCaption;
    }

    renderExistingImages();
    showSuccess('Caption updated');
  } catch (error) {
    showError('Error updating caption: ' + error.message);
  }
};

window.deleteImage = async function (resourceId) {
  if (!confirm('Are you sure you want to delete this image?')) return;

  try {
    const resource = existingImages.find((r) => r.id === resourceId);
    if (!resource) return;

    // Delete from storage
    const fileName = resource.resource_url.split('/').pop();
    if (fileName) {
      await supabase.storage.from('images').remove([fileName]);
    }

    // Delete from database
    const { error } = await supabase.from('class_resources').delete().eq('id', resourceId);

    if (error) {
      showError('Error deleting image: ' + error.message);
      return;
    }

    existingImages = existingImages.filter((r) => r.id !== resourceId);
    renderExistingImages();
    showSuccess('Image deleted');
  } catch (error) {
    showError('Error deleting image: ' + error.message);
  }
};

function setupFileUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const imageFile = document.getElementById('imageFile');
  const imagePreview = document.getElementById('imagePreview');

  uploadArea.addEventListener('click', () => imageFile.click());

  imageFile.addEventListener('change', (e) => {
    handleFileSelect(e.target.files);
  });

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
}

function handleFileSelect(files) {
  const imageFile = document.getElementById('imageFile');
  const uploadArea = document.getElementById('uploadArea');
  uploadArea.classList.remove('dragover');

  const maxSize = 5 * 1024 * 1024; // 5MB
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  for (const file of files) {
    if (!validTypes.includes(file.type)) {
      showError(`File "${file.name}" is not a valid image format`);
      continue;
    }
    if (file.size > maxSize) {
      showError(`File "${file.name}" is larger than 5MB`);
      continue;
    }

    selectedFiles.push(file);
  }

  imageFile.value = '';
  updatePreview();
}

function updatePreview() {
  const imagePreview = document.getElementById('imagePreview');

  if (selectedFiles.length === 0) {
    imagePreview.innerHTML = '';
    return;
  }

  imagePreview.innerHTML = selectedFiles
    .map((file, index) => {
      const reader = new FileReader();
      let dataUrl = '';

      reader.onload = (e) => {
        const item = document.querySelector(`[data-file-index="${index}"]`);
        if (item) {
          item.querySelector('img').src = e.target.result;
        }
      };

      reader.readAsDataURL(file);

      return `
        <div class="preview-item" data-file-index="${index}">
          <img src="" alt="Preview" class="preview-img">
          <input 
            type="text" 
            class="preview-caption-input" 
            placeholder="Add caption (optional)"
            data-caption-for="${index}"
            maxlength="200"
          >
          <button type="button" class="preview-remove" onclick="removePreview(${index})">
            ✕
          </button>
        </div>
      `;
    })
    .join('');

  // Re-initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

window.removePreview = function (index) {
  selectedFiles.splice(index, 1);
  updatePreview();
};

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'");
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;

  try {
    const title = document.getElementById('topicTitle').value.trim();
    const description = document.getElementById('topicDescription').value.trim();
    const content = document.getElementById('topicContent').value.trim();
    let displayOrder = document.getElementById('displayOrder').value;

    if (!title) {
      showError('Topic title is required');
      submitBtn.disabled = false;
      return;
    }

    // Update topic
    const updateData = {
      title,
      description,
      content,
    };

    if (displayOrder) {
      updateData.display_order = parseInt(displayOrder);
    }

    const { error: updateError } = await supabase.from('topics').update(updateData).eq('id', topicId);

    if (updateError) {
      showError('Error updating topic: ' + updateError.message);
      submitBtn.disabled = false;
      return;
    }

    // Upload new images if any
    if (selectedFiles.length > 0) {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const caption = document.querySelector(`[data-caption-for="${i}"]`)?.value || '';

        try {
          const fileName = `${Date.now()}_${i}_${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, file);

          if (uploadError) {
            showError(`Error uploading "${file.name}": ${uploadError.message}`);
            continue;
          }

          const publicUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;

          // Save to database
          const { error: insertError } = await supabase.from('class_resources').insert({
            class_id: classId,
            topic_id: topicId,
            title: file.name,
            description: caption,
            resource_url: publicUrl,
            resource_type: 'image',
            file_size: file.size,
            uploaded_by: (await supabase.auth.getSession()).data.session?.user?.id,
            display_order: Date.now() + i,
          });

          if (insertError) {
            showError(`Error saving image metadata: ${insertError.message}`);
          }
        } catch (error) {
          showError(`Error uploading image: ${error.message}`);
        }
      }
    }

    showSuccess('Topic updated successfully!');
    setTimeout(() => {
      window.location.href = `/TEMPLATES/FrameTopicManagement.html`;
    }, 1500);
  } catch (error) {
    showError('Error updating topic: ' + error.message);
    submitBtn.disabled = false;
  }
}

function showSuccess(message) {
  const successMsg = document.getElementById('successMessage');
  const successText = document.getElementById('successText');
  successText.textContent = message;
  successMsg.classList.add('show');
  setTimeout(() => {
    successMsg.classList.remove('show');
  }, 5000);
}

function showError(message) {
  const errorMsg = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  errorText.textContent = message;
  errorMsg.classList.add('show');
  console.error(message);
}
