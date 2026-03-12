import { supabase } from './supabase-auth.js';

// Get activity type from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const initialActivityType = urlParams.get('type') || 'assignment';

// Activity type switching
const typeButtons = document.querySelectorAll('.activity-type-btn');
const selectedTypeInput = document.getElementById('selectedActivityType');
const activityForms = document.querySelectorAll('.activity-form');

// Dropdowns for class/topic
const classSelect = document.getElementById('classSelect');
const topicSelect = document.getElementById('topicSelect');
let allClasses = [];
let allTopics = {};

// Load instructor's classes on page load
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
      return;
    }
    
    allClasses = classes || [];
    
    // Populate class dropdown
    classSelect.innerHTML = '<option value="">-- Select a class --</option>';
    allClasses.forEach(cls => {
      const option = document.createElement('option');
      option.value = cls.id;
      option.textContent = cls.class_name;
      classSelect.appendChild(option);
    });
    
  } catch (err) {
    console.error('Error loading classes:', err);
  }
}

// Load topics when class is selected
classSelect.addEventListener('change', async function() {
  const classId = this.value;
  topicSelect.innerHTML = '<option value="">-- Select a topic or leave blank --</option>';
  
  if (!classId) return;
  
  try {
    // Check if we already have topics cached for this class
    if (allTopics[classId]) {
      populateTopicSelect(allTopics[classId]);
      return;
    }
    
    // Fetch topics for this class
    const { data: topics, error } = await supabase
      .from('topics')
      .select('id, title')
      .eq('class_id', classId)
      .order('title', { ascending: true });
    
    if (error) {
      console.error('Error loading topics:', error);
      return;
    }
    
    allTopics[classId] = topics || [];
    populateTopicSelect(allTopics[classId]);
    
  } catch (err) {
    console.error('Error loading topics:', err);
  }
});

// Helper function to populate topic dropdown
function populateTopicSelect(topics) {
  topicSelect.innerHTML = '<option value="">-- Select a topic or leave blank --</option>';
  topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic.id;
    option.textContent = topic.title;
    topicSelect.appendChild(option);
  });
}

// Function to set activity type
function setActivityType(type) {
  selectedTypeInput.value = type;
  
  // Remove active state from all buttons
  typeButtons.forEach(b => b.classList.remove('bg-blue-100', 'border-blue-600'));
  
  // Find and activate the correct button
  const button = document.querySelector(`[data-type="${type}"]`);
  if (button) {
    button.classList.add('bg-blue-100', 'border-blue-600');
  }
  
  // Remove required from all form inputs first
  document.querySelectorAll('.activity-form input[type="text"], .activity-form input[type="datetime-local"], .activity-form input[type="number"], .activity-form textarea').forEach(input => {
    input.removeAttribute('required');
  });
  
  // Hide all forms
  activityForms.forEach(form => form.classList.add('hidden'));
  
  // Show selected form and add required to its inputs
  const formMap = {
    assignment: 'assignmentForm',
    quiz: 'quizForm',
    reflection: 'reflectionForm',
    discussion: 'discussionForm'
  };
  
  const formId = formMap[type];
  if (formId) {
    const form = document.getElementById(formId);
    form.classList.remove('hidden');
    
    // Add required attribute to text/textarea/date inputs in the visible form (except optional ones)
    form.querySelectorAll('input[type="text"], input[type="datetime-local"], textarea').forEach(input => {
      // Only add required if it should be (not all fields are required)
      if (input.id === 'assignTitle' || input.id === 'assignDesc' || input.id === 'assignDueDate' ||
          input.id === 'quizTitle' || input.id === 'reflectTitle' || input.id === 'discTitle') {
        input.setAttribute('required', 'required');
      }
    });
  }
}

// Initialize with URL parameter or default
setActivityType(initialActivityType);

typeButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    // Remove active state from all buttons
    typeButtons.forEach(b => b.classList.remove('bg-blue-100', 'border-blue-600'));
    // Add active state to clicked button
    this.classList.add('bg-blue-100', 'border-blue-600');
    
    // Update hidden input
    const type = this.getAttribute('data-type');
    selectedTypeInput.value = type;
    
    // Remove required from all form inputs first
    document.querySelectorAll('.activity-form input[type="text"], .activity-form input[type="datetime-local"], .activity-form input[type="number"], .activity-form textarea').forEach(input => {
      input.removeAttribute('required');
    });
    
    // Hide all forms
    activityForms.forEach(form => form.classList.add('hidden'));
    
    // Show selected form and add required to its inputs
    const formMap = {
      assignment: 'assignmentForm',
      quiz: 'quizForm',
      reflection: 'reflectionForm',
      discussion: 'discussionForm'
    };
    
    const formId = formMap[type];
    if (formId) {
      const form = document.getElementById(formId);
      form.classList.remove('hidden');
      
      // Add required attribute to text/textarea/date inputs in the visible form
      form.querySelectorAll('input[type="text"], input[type="datetime-local"], textarea').forEach(input => {
        // Only add required if it should be (not all fields are required)
        if (input.id === 'assignTitle' || input.id === 'assignDesc' || input.id === 'assignDueDate' ||
            input.id === 'quizTitle' || input.id === 'reflectTitle' || input.id === 'discTitle') {
          input.setAttribute('required', 'required');
        }
      });
    }
  });
});

// Publish immediately toggle
const publishNowCheckbox = document.getElementById('publishNow');
const scheduleDiv = document.getElementById('scheduleDiv');

publishNowCheckbox.addEventListener('change', function() {
  if (this.checked) {
    scheduleDiv.classList.add('hidden');
  } else {
    scheduleDiv.classList.remove('hidden');
  }
});

// Form submission
document.getElementById('activityForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const activityType = selectedTypeInput.value;
  const classId = classSelect.value;
  const topicId = topicSelect.value;
  
  if (!classId) {
    alert('Please select a class');
    return;
  }
  
  console.log('Creating activity of type:', activityType);
  
  try {
    // Get current user
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      alert('Please log in first');
      return;
    }
    
    // Prepare activity data based on type
    let activityData = {
      instructor_id: user.id,
      activity_type: activityType,
      class_id: classId,
      topic_id: topicId || null,
      is_published: document.getElementById('publishNow').checked,
      notify_students: document.getElementById('notifyStudents').checked,
      created_at: new Date().toISOString()
    };
    
    // Add type-specific fields
    if (activityType === 'assignment') {
      activityData = {
        ...activityData,
        title: document.getElementById('assignTitle').value,
        description: document.getElementById('assignDesc').value,
        due_date: document.getElementById('assignDueDate').value,
        points: parseInt(document.getElementById('assignPoints').value)
      };
    } else if (activityType === 'quiz') {
      activityData = {
        ...activityData,
        title: document.getElementById('quizTitle').value,
        description: document.getElementById('quizDesc').value,
        due_date: document.getElementById('quizDueDate').value,
        time_limit: parseInt(document.getElementById('quizTimeLimit').value),
        points: parseInt(document.getElementById('quizPoints').value)
      };
    } else if (activityType === 'reflection') {
      activityData = {
        ...activityData,
        title: document.getElementById('reflectTitle').value,
        prompt: document.getElementById('reflectPrompt').value,
        due_date: document.getElementById('reflectDueDate').value,
        min_words: parseInt(document.getElementById('reflectMinWords').value)
      };
    } else if (activityType === 'discussion') {
      activityData = {
        ...activityData,
        title: document.getElementById('discTitle').value,
        prompt: document.getElementById('discPrompt').value,
        due_date: document.getElementById('discDueDate').value,
        require_reply: document.getElementById('discRequireReply').checked
      };
    }
    
    // Handle schedule date if not publishing immediately
    if (!document.getElementById('publishNow').checked) {
      activityData.scheduled_date = document.getElementById('scheduleDate').value;
    }
    
    // Insert activity into database
    const { data, error } = await supabase
      .from('activities')
      .insert([activityData])
      .select();
    
    if (error) {
      console.error('Error creating activity:', error);
      alert('Failed to create activity: ' + error.message);
      return;
    }
    
    console.log('Activity created successfully:', data);
    
    // Check if data was returned before trying to access it
    if (!data || data.length === 0) {
      console.warn('Activity inserted but no data returned');
      alert('Activity created but could not retrieve ID for file upload');
      window.location.href = '/TEMPLATES/FrameInstructorDashboard.html';
      return;
    }
    
    // Handle file uploads if present
    await uploadActivityFiles(data[0].id, activityType);
    
    alert('Activity created successfully!');
    window.location.href = '/TEMPLATES/FrameInstructorDashboard.html';
    
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('An unexpected error occurred: ' + err.message);
  }
});

/**
 * Upload files associated with the activity
 */
async function uploadActivityFiles(activityId, activityType) {
  let fileInput = null;
  
  switch(activityType) {
    case 'assignment':
      fileInput = document.getElementById('assignFile');
      break;
    case 'quiz':
      fileInput = document.getElementById('quizFile');
      break;
  }
  
  if (!fileInput || !fileInput.files.length) {
    return; // No file to upload
  }
  
  const file = fileInput.files[0];
  const fileName = `${activityType}_${activityId}_${Date.now()}_${file.name}`;
  
  try {
    console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);
    
    const { data, error } = await supabase.storage
      .from('activities')
      .upload(fileName, file);
    
    if (error) {
      console.error('Error uploading file:', error);
      console.error('Error code:', error.error);
      console.error('Error message:', error.message);
      console.error('Status:', error.status);
      
      // Provide specific error message
      let errorMsg = 'File upload failed, but activity was created.';
      if (error.message.includes('Bucket not found')) {
        errorMsg = 'The activities bucket does not exist. Please create it in Supabase Storage settings.';
      } else if (error.message.includes('permission') || error.message.includes('policy')) {
        errorMsg = 'Permission denied: Check bucket policies in Supabase. Instructors should have upload permissions.';
      } else if (error.message.includes('Payload too large')) {
        errorMsg = 'File is too large. Maximum size is 100MB.';
      }
      
      alert(errorMsg + '\n\nError details: ' + error.message);
      return;
    }
    
    console.log('File uploaded successfully:', data);
    
    // Update activity with file URL
    const { data: publicUrl } = supabase.storage
      .from('activities')
      .getPublicUrl(fileName);
    
    console.log('Public URL:', publicUrl.publicUrl);
    
    await supabase
      .from('activities')
      .update({ file_url: publicUrl.publicUrl })
      .eq('id', activityId);
    
    console.log('Activity updated with file URL');
  } catch (err) {
    console.error('Unexpected file upload error:', err);
  }
}

// Initialize: Load classes when page loads
document.addEventListener('DOMContentLoaded', loadClasses);
