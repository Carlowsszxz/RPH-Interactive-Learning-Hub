import { supabase } from './supabase-auth.js';

// Form elements
const topicForm = document.getElementById('topicForm');
const classSelect = document.getElementById('classSelect');
const topicTitle = document.getElementById('topicTitle');
const topicDescription = document.getElementById('topicDescription');
const topicContent = document.getElementById('topicContent');
const displayOrder = document.getElementById('displayOrder');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const successText = document.getElementById('successText');
const errorText = document.getElementById('errorText');
const uploadArea = document.getElementById('uploadArea');
const imageFile = document.getElementById('imageFile');
const imagePreview = document.getElementById('imagePreview');

let allClasses = [];
let selectedFiles = [];

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

// Update preview with caption inputs
function updatePreview() {
  imagePreview.innerHTML = selectedFiles.map((file, index) => `
    <div class="preview-item">
      <img src="${URL.createObjectURL(file)}" alt="${file.name}" class="preview-img">
      <input 
        type="text" 
        class="preview-caption-input" 
        placeholder="Add a caption..."
        maxlength="200"
        data-index="${index}"
        data-filename="${file.name}"
      >
      <button type="button" class="preview-remove" onclick="removePreview(${index})">×</button>
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
topicForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const selectedClassId = classSelect.value;
  const title = topicTitle.value.trim();
  const description = topicDescription.value.trim();
  const content = topicContent.value.trim();
  const order = displayOrder.value ? parseInt(displayOrder.value) : null;
  
  // Validation
  if (!selectedClassId) {
    showError('Please select a class');
    return;
  }
  
  if (!title) {
    showError('Please enter a topic title');
    return;
  }
  
  submitBtn.disabled = true;
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i data-lucide="loader"></i> Creating...';
  
  try {
    // Get current user
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      showError('User not authenticated');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      return;
    }
    
    // Create the topic
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .insert([
        {
          class_id: selectedClassId,
          title: title,
          description: description || null,
          content: content || null,
          display_order: order
        }
      ])
      .select();
    
    if (topicError) {
      console.error('Error creating topic:', topicError);
      showError('Failed to create topic: ' + topicError.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      return;
    }
    
    const topicId = topicData[0].id;
    
    // Upload images if any
    let uploadedCount = 0;
    if (selectedFiles.length > 0) {
      console.log('Starting image uploads. Total files:', selectedFiles.length);
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const caption = document.querySelector(`input[data-index="${i}"]`)?.value.trim() || '';
        
        console.log(`Processing file ${i + 1}/${selectedFiles.length}:`, file.name, 'Caption:', caption);
        
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `${selectedClassId}/${timestamp}_${randomStr}_${file.name}`;
        
        console.log('Uploading to storage. File name:', fileName);
        
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Upload error for file', file.name, ':', uploadError);
          continue;
        }
        
        console.log('Storage upload successful');
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
        
        const publicUrl = urlData?.publicUrl;
        console.log('Public URL:', publicUrl);
        
        // Save metadata to database
        const insertData = {
          class_id: selectedClassId,
          topic_id: topicId,
          title: caption || file.name,
          description: caption || null,
          resource_url: publicUrl,
          resource_type: 'image',
          file_size: file.size,
          uploaded_by: user.id,
          display_order: timestamp
        };
        
        console.log('Saving to database:', insertData);
        
        const { data: insertResult, error: dbError } = await supabase
          .from('class_resources')
          .insert([insertData]);
        
        if (dbError) {
          console.error('❌ DATABASE ERROR for file', file.name, ':', dbError);
          console.error('Full error object:', JSON.stringify(dbError, null, 2));
          continue;
        }
        
        console.log('✅ Database insert successful. Result:', insertResult);
        uploadedCount++;
      }
      
      console.log('Total files uploaded successfully:', uploadedCount);
    }
    
    if (uploadedCount > 0) {
      showSuccess(`Topic created with ${uploadedCount} image${uploadedCount > 1 ? 's' : ''}!`);
    } else if (selectedFiles.length === 0) {
      showSuccess(`Topic "${title}" created successfully!`);
    } else {
      showSuccess(`Topic created, but ${selectedFiles.length - uploadedCount} image(s) failed to upload.`);
    }
    
    // Reset form and redirect
    topicForm.reset();
    selectedFiles = [];
    imagePreview.innerHTML = '';
    
    setTimeout(() => {
      window.location.href = '/TEMPLATES/FrameInstructorDashboard.html';
    }, 2000);
  } catch (err) {
    console.error('Error:', err);
    showError('Error creating topic: ' + err.message);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// Initialize on page load
loadClasses();

// Render lucide icons
setTimeout(() => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}, 100);
