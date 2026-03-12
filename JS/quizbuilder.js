import { supabase } from './supabase-auth.js';
import { loadNavigation } from './navigation-loader.js';

// Quiz data structure
let quizData = {
  id: null,
  title: '',
  description: '',
  class_id: null,
  time_limit_minutes: null,
  status: 'draft',
  questions: []
};

let questions = [];
let currentEditingQuestionIndex = null;
let classes = [];

// Initialize
document.addEventListener('DOMContentLoaded', async function(){
  await loadNavigation('nav-container');
  setupLogout();
  
  // Load classes
  await loadClasses();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check if editing existing quiz
  const params = new URLSearchParams(location.search);
  const quizId = params.get('id');
  if (quizId) {
    await loadQuiz(quizId);
  }
  
  updateQuestionsList();
});

function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      if (!window.supabase) {
        alert('Supabase not available');
        return;
      }
      try {
        const { error } = await window.supabase.auth.signOut();
        if (error) {
          alert('Failed to log out');
          return;
        }
        window.location.href = '/TEMPLATES/FrameLogin.html';
      } catch (err) {
        alert('Error logging out');
      }
    });
  }
  const signOut = document.getElementById('signOut');
  if (signOut) {
    signOut.addEventListener('click', async function(e) {
      e.preventDefault();
      if (!window.supabase) {
        alert('Supabase not available');
        return;
      }
      try {
        const { error } = await window.supabase.auth.signOut();
        if (error) {
          alert('Failed to log out');
          return;
        }
        window.location.href = '/TEMPLATES/FrameLogin.html';
      } catch (err) {
        alert('Error logging out');
      }
    });
  }
}

async function loadClasses() {
  try {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('classes')
      .select('id, class_name')
      .eq('instructor_id', user.data.user.id);
    
    if (error) throw error;
    classes = data || [];
    
    const select = document.getElementById('quizClass');
    classes.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.class_name;
      select.appendChild(option);
    });
  } catch (e) {
    console.error('Failed to load classes:', e);
  }
}

async function loadQuiz(quizId) {
  try {
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .maybeSingle();
    
    if (error) throw error;
    if (!quiz) {
      showStatus('Quiz not found', 'error');
      return;
    }
    
    // Load questions
    const { data: qs, error: qError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: true });
    
    if (qError) throw qError;
    
    // Map questions to builder format and load options
    const mappedQuestions = [];
    for (let dbQ of qs) {
      // Map schema question types back to builder types
      let builderType = dbQ.question_type;
      if (dbQ.question_type === 'multiple_choice') builderType = 'multiple-choice';
      else if (dbQ.question_type === 'short_answer') builderType = 'short-answer';
      
      const q = {
        id: dbQ.id,
        type: builderType,
        text: dbQ.question_text,
        options: []
      };
      
      // Load options for choice questions
      if (dbQ.question_type === 'multiple_choice') {
        const { data: opts, error: oError } = await supabase
          .from('quiz_options')
          .select('*')
          .eq('question_id', dbQ.id)
          .order('option_order', { ascending: true });
        
        if (!oError && opts) {
          q.options = opts.map(o => o.option_text);
        }
      }
      
      mappedQuestions.push(q);
    }
    
    quizData = {
      id: quiz.id,
      title: quiz.title || '',
      description: quiz.description || '',
      class_id: quiz.class_id,
      time_limit_minutes: quiz.time_limit_minutes,
      status: quiz.status || 'draft',
      questions: mappedQuestions
    };
    
    // Populate form
    document.getElementById('quizTitle').value = quizData.title;
    document.getElementById('quizDescription').value = quizData.description;
    if (quizData.class_id) {
      document.getElementById('quizClass').value = quizData.class_id;
    }
    if (quizData.time_limit_minutes) {
      document.getElementById('quizTimeLimit').value = quizData.time_limit_minutes;
    }
    
    // Load questions into editor
    questions = JSON.parse(JSON.stringify(mappedQuestions));
    updateQuestionsList();
  } catch (e) {
    console.error('Failed to load quiz:', e);
    showStatus('Failed to load quiz', 'error');
  }
}

function setupEventListeners() {
  // Quiz metadata
  document.getElementById('addQuestionBtn').addEventListener('click', openAddQuestionModal);
  document.getElementById('previewBtn').addEventListener('click', previewQuiz);
  document.getElementById('saveBtn').addEventListener('click', saveQuiz);
  document.getElementById('publishBtn').addEventListener('click', publishQuiz);
  document.getElementById('deleteBtn').addEventListener('click', deleteQuiz);
  
  // Modal
  document.getElementById('questionType').addEventListener('change', updateQuestionTypeOptions);
  document.getElementById('addOptionBtn').addEventListener('click', addOptionInput);
  document.getElementById('saveQuestionBtn').addEventListener('click', saveQuestion);
  document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
}

function openAddQuestionModal() {
  currentEditingQuestionIndex = null;
  resetModal();
  document.getElementById('questionModal').removeAttribute('hidden');
}

function resetModal() {
  document.getElementById('questionType').value = '';
  document.getElementById('questionText').value = '';
  document.getElementById('questionRequired').checked = false;
  document.getElementById('ratingMin').value = 'Poor';
  document.getElementById('ratingMax').value = 'Excellent';
  document.getElementById('ratingScale').value = '5';
  document.getElementById('optionsList').innerHTML = '';
  document.getElementById('optionsSection').setAttribute('hidden', '');
  document.getElementById('ratingSection').setAttribute('hidden', '');
  document.getElementById('saveQuestionBtn').textContent = 'Add Question';
}

function closeModal() {
  document.getElementById('questionModal').setAttribute('hidden', '');
  resetModal();
}

function updateQuestionTypeOptions() {
  const type = document.getElementById('questionType').value;
  const optionsSection = document.getElementById('optionsSection');
  const ratingSection = document.getElementById('ratingSection');
  
  if (['multiple-choice', 'checkboxes', 'dropdown'].includes(type)) {
    optionsSection.removeAttribute('hidden');
    document.getElementById('optionsList').innerHTML = '';
    addOptionInput();
    addOptionInput();
    ratingSection.setAttribute('hidden', '');
  } else if (type === 'rating') {
    ratingSection.removeAttribute('hidden');
    optionsSection.setAttribute('hidden', '');
  } else {
    optionsSection.setAttribute('hidden', '');
    ratingSection.setAttribute('hidden', '');
  }
  
  lucide.createIcons();
}

function addOptionInput() {
  const optionsList = document.getElementById('optionsList');
  const optionItem = document.createElement('div');
  optionItem.className = 'option-item';
  optionItem.innerHTML = `
    <input type="text" placeholder="Enter option text..." class="option-input">
    <button type="button" class="option-delete">Delete</button>
  `;
  
  optionItem.querySelector('.option-delete').addEventListener('click', function(e) {
    e.preventDefault();
    optionItem.remove();
  });
  
  optionsList.appendChild(optionItem);
}

function saveQuestion() {
  const type = document.getElementById('questionType').value;
  const text = document.getElementById('questionText').value.trim();
  const required = document.getElementById('questionRequired').checked;
  
  if (!type) {
    showStatus('Please select a question type', 'warning');
    return;
  }
  if (!text) {
    showStatus('Please enter question text', 'warning');
    return;
  }
  
  const question = {
    id: currentEditingQuestionIndex !== null ? questions[currentEditingQuestionIndex].id : null,
    type,
    text,
    required,
    order: currentEditingQuestionIndex !== null ? currentEditingQuestionIndex : questions.length
  };
  
  // Handle type-specific data
  if (['multiple-choice', 'checkboxes', 'dropdown'].includes(type)) {
    const inputs = document.querySelectorAll('.option-input');
    const options = Array.from(inputs)
      .map(inp => inp.value.trim())
      .filter(opt => opt.length > 0);
    
    if (options.length < 2) {
      showStatus('Please add at least 2 options', 'warning');
      return;
    }
    
    question.options = options;
  } else if (type === 'rating') {
    question.ratingMin = document.getElementById('ratingMin').value;
    question.ratingMax = document.getElementById('ratingMax').value;
    question.ratingScale = parseInt(document.getElementById('ratingScale').value);
  }
  
  if (currentEditingQuestionIndex !== null) {
    questions[currentEditingQuestionIndex] = question;
  } else {
    questions.push(question);
  }
  
  closeModal();
  updateQuestionsList();
  showStatus('Question added successfully', 'success');
}

function updateQuestionsList() {
  const list = document.getElementById('questionsList');
  
  if (questions.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg data-lucide="file-question" width="48" height="48"></svg>
        <p>No questions yet. Add one to get started!</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  list.innerHTML = questions.map((q, idx) => `
    <div class="question-card" data-index="${idx}">
      <div class="question-header">
        <span class="question-number">Question ${idx + 1}</span>
        <span class="question-type-badge">${formatQuestionType(q.type)}</span>
        ${q.required ? '<span class="question-type-badge" style="background: #FFEBEE; color: #C62828;">Required</span>' : ''}
      </div>
      <h3 class="question-card-title">${escapeHTML(q.text)}</h3>
      ${renderQuestionPreview(q)}
      <div class="question-actions">
        <button class="icon-btn edit-btn" title="Edit">
          <svg data-lucide="edit-2" width="16" height="16"></svg>
        </button>
        <button class="icon-btn move-up-btn" title="Move up" ${idx === 0 ? 'disabled' : ''}>
          <svg data-lucide="arrow-up" width="16" height="16"></svg>
        </button>
        <button class="icon-btn move-down-btn" title="Move down" ${idx === questions.length - 1 ? 'disabled' : ''}>
          <svg data-lucide="arrow-down" width="16" height="16"></svg>
        </button>
        <button class="icon-btn delete delete-btn" title="Delete">
          <svg data-lucide="trash-2" width="16" height="16"></svg>
        </button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  list.querySelectorAll('.edit-btn').forEach((btn, idx) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      editQuestion(idx);
    });
  });
  
  list.querySelectorAll('.delete-btn').forEach((btn, idx) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      deleteQuestion(idx);
    });
  });
  
  list.querySelectorAll('.move-up-btn').forEach((btn, idx) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      moveQuestion(idx, idx - 1);
    });
  });
  
  list.querySelectorAll('.move-down-btn').forEach((btn, idx) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      moveQuestion(idx, idx + 1);
    });
  });
  
  lucide.createIcons();
}

function renderQuestionPreview(q) {
  if (q.type === 'short-answer') {
    return '<div class="question-preview">Short text response</div>';
  }
  if (q.type === 'essay') {
    return '<div class="question-preview">Long text response (paragraph)</div>';
  }
  if (q.type === 'rating') {
    return `<div class="question-preview">Rating scale: ${q.ratingMin} to ${q.ratingMax} (${q.ratingScale} levels)</div>`;
  }
  if (['multiple-choice', 'checkboxes', 'dropdown'].includes(q.type)) {
    return `
      <div class="question-options-preview">
        ${(q.options || []).map(opt => `<div class="option-preview">${escapeHTML(opt)}</div>`).join('')}
      </div>
    `;
  }
  return '';
}

function formatQuestionType(type) {
  const map = {
    'multiple-choice': 'Multiple Choice',
    'checkboxes': 'Checkboxes',
    'dropdown': 'Dropdown',
    'short-answer': 'Short Answer',
    'essay': 'Essay',
    'rating': 'Rating Scale'
  };
  return map[type] || type;
}

function editQuestion(idx) {
  currentEditingQuestionIndex = idx;
  const q = questions[idx];
  
  document.getElementById('questionType').value = q.type;
  document.getElementById('questionText').value = q.text;
  document.getElementById('questionRequired').checked = q.required || false;
  
  if (['multiple-choice', 'checkboxes', 'dropdown'].includes(q.type)) {
    const optionsList = document.getElementById('optionsList');
    optionsList.innerHTML = '';
    (q.options || []).forEach(opt => {
      const item = document.createElement('div');
      item.className = 'option-item';
      item.innerHTML = `
        <input type="text" placeholder="Enter option text..." class="option-input" value="${escapeHTML(opt)}">
        <button type="button" class="option-delete">Delete</button>
      `;
      item.querySelector('.option-delete').addEventListener('click', (e) => {
        e.preventDefault();
        item.remove();
      });
      optionsList.appendChild(item);
    });
    document.getElementById('optionsSection').removeAttribute('hidden');
    document.getElementById('ratingSection').setAttribute('hidden', '');
  } else if (q.type === 'rating') {
    document.getElementById('ratingMin').value = q.ratingMin || 'Poor';
    document.getElementById('ratingMax').value = q.ratingMax || 'Excellent';
    document.getElementById('ratingScale').value = q.ratingScale || 5;
    document.getElementById('ratingSection').removeAttribute('hidden');
    document.getElementById('optionsSection').setAttribute('hidden', '');
  }
  
  document.getElementById('saveQuestionBtn').textContent = 'Update Question';
  document.getElementById('questionModal').removeAttribute('hidden');
  lucide.createIcons();
}

function deleteQuestion(idx) {
  if (confirm('Delete this question?')) {
    questions.splice(idx, 1);
    updateQuestionsList();
    showStatus('Question deleted', 'success');
  }
}

function moveQuestion(fromIdx, toIdx) {
  [questions[fromIdx], questions[toIdx]] = [questions[toIdx], questions[fromIdx]];
  updateQuestionsList();
}

async function saveQuiz() {
  const title = document.getElementById('quizTitle').value.trim();
  if (!title) {
    showStatus('Please enter a quiz title', 'warning');
    return;
  }
  const classId = document.getElementById('quizClass').value;
  if (!classId) {
    showStatus('Please select a class', 'warning');
    return;
  }
  if (questions.length === 0) {
    showStatus('Please add at least one question', 'warning');
    return;
  }
  
  try {
    const user = await supabase.auth.getUser();
    const userData = {
      title,
      description: document.getElementById('quizDescription').value,
      class_id: classId,
      created_by: user.data.user.id,
      status: 'active'
    };
    
    // Time limit if provided (in minutes)
    const timeLimit = document.getElementById('quizTimeLimit').value;
    if (timeLimit) {
      userData.time_limit_minutes = parseInt(timeLimit);
    }
    
    let quizId = quizData.id;
    
    if (!quizId) {
      // Create new quiz
      const { data, error } = await supabase
        .from('quizzes')
        .insert([userData])
        .select('id')
        .single();
      
      if (error) throw error;
      quizId = data.id;
      quizData.id = quizId;
    } else {
      // Update existing
      const { error } = await supabase
        .from('quizzes')
        .update(userData)
        .eq('id', quizId);
      
      if (error) throw error;
    }
    
    // Save questions
    // First delete existing questions
    if (quizId && quizData.questions.length > 0) {
      await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId);
    }
    
    // Insert new questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // Map builder question types to schema types
      let schemaType = q.type;
      if (q.type === 'multiple-choice') schemaType = 'multiple_choice';
      else if (q.type === 'short-answer') schemaType = 'short_answer';
      else if (q.type === 'checkboxes' || q.type === 'dropdown') schemaType = 'multiple_choice';
      else if (q.type === 'rating') schemaType = 'essay';
      
      const qData = {
        quiz_id: quizId,
        question_type: schemaType,
        question_text: q.text,
        question_order: i,
        points: 1
      };
      
      const { data: qResult, error: qError } = await supabase
        .from('quiz_questions')
        .insert([qData])
        .select('id')
        .single();
      
      if (qError) throw qError;
      
      // Save options (only for multiple choice variants)
      if (['multiple-choice', 'checkboxes', 'dropdown'].includes(q.type) && q.options) {
        const optionData = q.options.map((opt, optIdx) => ({
          question_id: qResult.id,
          option_text: opt,
          option_order: optIdx
        }));
        
        const { error: oError } = await supabase
          .from('quiz_options')
          .insert(optionData);
        
        if (oError) throw oError;
      }
    }
    
    showStatus('Quiz saved successfully!', 'success');
    window.location.href = `/TEMPLATES/FrameQuizBuilder.html?id=${quizId}`;
  } catch (e) {
    console.error('Failed to save quiz:', e);
    showStatus('Failed to save quiz: ' + (e.message || 'Unknown error'), 'error');
  }
}

async function publishQuiz() {
  if (!quizData.id) {
    showStatus('Please save the quiz first', 'warning');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('quizzes')
      .update({ status: 'active' })
      .eq('id', quizData.id);
    
    if (error) throw error;
    showStatus('Quiz published successfully!', 'success');
    quizData.status = 'active';
  } catch (e) {
    console.error('Failed to publish quiz:', e);
    showStatus('Failed to publish quiz', 'error');
  }
}

async function deleteQuiz() {
  if (!quizData.id) {
    showStatus('No quiz to delete', 'warning');
    return;
  }
  
  if (!confirm('Delete this quiz? This cannot be undone.')) return;
  
  try {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizData.id);
    
    if (error) throw error;
    showStatus('Quiz deleted. Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = '/TEMPLATES/FrameClassDetail.html';
    }, 1500);
  } catch (e) {
    console.error('Failed to delete quiz:', e);
    showStatus('Failed to delete quiz', 'error');
  }
}

function previewQuiz() {
  // Save to session storage and open preview
  sessionStorage.setItem('quizPreview', JSON.stringify({
    title: document.getElementById('quizTitle').value,
    description: document.getElementById('quizDescription').value,
    questions: questions
  }));
  
  window.open('/TEMPLATES/FrameQuizPreview.html', '_blank');
}

function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-message show ${type}`;
  
  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 4000);
}

function escapeHTML(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
