import { supabase } from './supabase-auth.js';
import { loadNavigation, setupLogout } from './navigation-loader.js';

let currentQuizData = {
  id: null,
  title: '',
  description: '',
  time_limit_minutes: null,
  questions: []
};

let studentResponses = {}; // { question_id: answer }
let quizAttempt = null; // Will store attempt record
let timeRemaining = null;
let timerInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadNavigation('nav-container');
  setupLogout();

  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Get quiz ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('id');

  if (!quizId) {
    showStatus('No quiz specified', 'error');
    return;
  }

  await loadQuiz(quizId);
});

async function loadQuiz(quizId) {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      showStatus('Not authenticated', 'error');
      return;
    }

    // Load quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      showStatus('Quiz not found', 'error');
      return;
    }

    currentQuizData = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.instructions || quiz.description || '',
      time_limit_minutes: quiz.time_limit_minutes,
      questions: []
    };

    // Load questions
    const { data: questions, error: qError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: true });

    if (qError) {
      console.error('Error loading questions:', qError);
      showStatus('Failed to load questions', 'error');
      return;
    }

    // Load options for each question
    for (let q of questions) {
      const qObj = {
        id: q.id,
        type: mapQuestionType(q.question_type),
        text: q.question_text,
        required: q.points ? true : false,
        options: []
      };

      if (['multiple_choice'].includes(q.question_type)) {
        const { data: opts, error: oError } = await supabase
          .from('quiz_options')
          .select('*')
          .eq('question_id', q.id)
          .order('option_order', { ascending: true });

        if (!oError && opts) {
          qObj.options = opts.map(o => ({
            id: o.id,
            text: o.option_text,
            is_correct: o.is_correct
          }));
        }
      }

      currentQuizData.questions.push(qObj);
    }

    // Populate header
    document.getElementById('quizTitle').textContent = currentQuizData.title;
    document.getElementById('quizDescription').textContent = currentQuizData.description;
    document.getElementById('progressDisplay').textContent = `${currentQuizData.questions.length === 0 ? 0 : 1} / ${currentQuizData.questions.length}`;

    // Create quiz attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert([
        {
          quiz_id: quizId,
          user_id: user.data.user.id,
          status: 'in_progress',
          started_at: new Date().toISOString()
        }
      ])
      .select('id')
      .single();

    if (attemptError) {
      console.error('Error creating attempt:', attemptError);
      showStatus('Failed to start quiz', 'error');
      return;
    }

    quizAttempt = attempt;

    // Start timer if needed
    if (currentQuizData.time_limit_minutes) {
      timeRemaining = currentQuizData.time_limit_minutes * 60;
      startTimer();
    }

    // Render questions
    renderQuestions();

    // Setup button listeners
    document.getElementById('backBtn').addEventListener('click', () => {
      window.history.back();
    });

    document.getElementById('submitBtn').addEventListener('click', submitQuiz);
  } catch (err) {
    console.error('Error loading quiz:', err);
    showStatus('Error loading quiz', 'error');
  }
}

function mapQuestionType(dbType) {
  const typeMap = {
    'multiple_choice': 'multiple-choice',
    'short_answer': 'short-answer',
    'essay': 'essay',
    'true_false': 'true-false',
    'matching': 'matching'
  };
  return typeMap[dbType] || dbType;
}

function renderQuestions() {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '';

  if (currentQuizData.questions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="inbox"></i>
        <h2>No questions</h2>
        <p>This quiz has no questions yet.</p>
      </div>
    `;
    window.lucide.createIcons();
    return;
  }

  currentQuizData.questions.forEach((q, idx) => {
    const card = createQuestionCard(q, idx + 1);
    container.appendChild(card);
  });

  // Re-initialize lucide icons
  window.lucide.createIcons();

  // Add event listeners for responses
  setupResponseListeners();
}

function createQuestionCard(question, number) {
  const card = document.createElement('div');
  card.className = 'question-card';
  card.id = `question-${question.id}`;

  let contentHTML = '';

  switch (question.type) {
    case 'multiple-choice':
      contentHTML = createMultipleChoiceContent(question);
      break;
    case 'checkboxes':
      contentHTML = createCheckboxesContent(question);
      break;
    case 'dropdown':
      contentHTML = createDropdownContent(question);
      break;
    case 'short-answer':
      contentHTML = createShortAnswerContent(question);
      break;
    case 'essay':
      contentHTML = createEssayContent(question);
      break;
    case 'true-false':
      contentHTML = createTrueFalseContent(question);
      break;
    default:
      contentHTML = `<p class="text-secondary">Unknown question type: ${question.type}</p>`;
  }

  card.innerHTML = `
    <div class="question-header">
      <div class="question-number">${number}</div>
      <p class="question-text">${escapeHtml(question.text)}</p>
    </div>
    <div class="question-body">
      ${contentHTML}
    </div>
  `;

  return card;
}

function createMultipleChoiceContent(question) {
  return `
    <div class="options-list">
      ${question.options.map((opt, idx) => `
        <label class="option-item">
          <input type="radio" name="question-${question.id}" value="${opt.id}" data-question-id="${question.id}">
          <span class="option-label">${escapeHtml(opt.text)}</span>
        </label>
      `).join('')}
    </div>
  `;
}

function createCheckboxesContent(question) {
  return `
    <div class="options-list">
      ${question.options.map((opt, idx) => `
        <label class="option-item">
          <input type="checkbox" name="question-${question.id}" value="${opt.id}" data-question-id="${question.id}">
          <span class="option-label">${escapeHtml(opt.text)}</span>
        </label>
      `).join('')}
    </div>
  `;
}

function createDropdownContent(question) {
  return `
    <select class="dropdown-select" data-question-id="${question.id}">
      <option value="">-- Select an option --</option>
      ${question.options.map(opt => `
        <option value="${opt.id}">${escapeHtml(opt.text)}</option>
      `).join('')}
    </select>
  `;
}

function createShortAnswerContent(question) {
  return `
    <input type="text" class="text-input" data-question-id="${question.id}" placeholder="Your answer...">
  `;
}

function createEssayContent(question) {
  return `
    <textarea class="textarea-input" data-question-id="${question.id}" placeholder="Type your answer here..."></textarea>
  `;
}

function createTrueFalseContent(question) {
  return `
    <div class="options-list">
      <label class="option-item">
        <input type="radio" name="question-${question.id}" value="true" data-question-id="${question.id}">
        <span class="option-label">True</span>
      </label>
      <label class="option-item">
        <input type="radio" name="question-${question.id}" value="false" data-question-id="${question.id}">
        <span class="option-label">False</span>
      </label>
    </div>
  `;
}

function setupResponseListeners() {
  // Radio buttons
  document.querySelectorAll('input[type="radio"]').forEach(input => {
    input.addEventListener('change', (e) => {
      const qId = e.target.dataset.questionId;
      studentResponses[qId] = e.target.value;
      console.log('Updated response:', qId, e.target.value);
    });
  });

  // Checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', (e) => {
      const qId = e.target.dataset.questionId;
      if (!studentResponses[qId]) {
        studentResponses[qId] = [];
      }
      if (e.target.checked) {
        if (!studentResponses[qId].includes(e.target.value)) {
          studentResponses[qId].push(e.target.value);
        }
      } else {
        studentResponses[qId] = studentResponses[qId].filter(v => v !== e.target.value);
      }
      console.log('Updated response:', qId, studentResponses[qId]);
    });
  });

  // Dropdowns
  document.querySelectorAll('.dropdown-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const qId = e.target.dataset.questionId;
      studentResponses[qId] = e.target.value;
      console.log('Updated response:', qId, e.target.value);
    });
  });

  // Text inputs
  document.querySelectorAll('.text-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const qId = e.target.dataset.questionId;
      studentResponses[qId] = e.target.value;
    });
  });

  // Textareas
  document.querySelectorAll('.textarea-input').forEach(textarea => {
    textarea.addEventListener('input', (e) => {
      const qId = e.target.dataset.questionId;
      studentResponses[qId] = e.target.value;
    });
  });
}

function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      showStatus('Time is up! Submitting quiz...', 'warning');
      setTimeout(submitQuiz, 2000);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  document.getElementById('timerDisplay').textContent = display;

  // Add warning styles
  if (timeRemaining <= 60) {
    document.getElementById('timerDisplay').classList.add('critical');
  } else if (timeRemaining <= 300) {
    document.getElementById('timerDisplay').classList.add('warning');
  }
}

async function submitQuiz() {
  if (!quizAttempt) {
    showStatus('Quiz not initialized', 'error');
    return;
  }

  // Disable submit button
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;

  showStatus('Submitting quiz...', 'info');

  try {
    // Save all responses to database
    if (Object.keys(studentResponses).length > 0) {
      const responsesToInsert = [];

      for (const [questionId, answer] of Object.entries(studentResponses)) {
        const question = currentQuizData.questions.find(q => q.id === questionId);
        if (!question) continue;

        if (question.type === 'multiple-choice') {
          const selectedOption = question.options.find(o => o.id === answer);
          responsesToInsert.push({
            attempt_id: quizAttempt.id,
            question_id: questionId,
            selected_option_id: answer,
            is_correct: selectedOption?.is_correct || false,
            points_earned: selectedOption?.is_correct ? 1 : 0
          });
        } else if (question.type === 'checkboxes') {
          const selectedIds = Array.isArray(answer) ? answer : [];
          for (const optId of selectedIds) {
            responsesToInsert.push({
              attempt_id: quizAttempt.id,
              question_id: questionId,
              selected_option_id: optId,
              is_correct: false,
              points_earned: 0
            });
          }
        } else {
          // Short answer, essay, etc. - no auto-grading
          responsesToInsert.push({
            attempt_id: quizAttempt.id,
            question_id: questionId,
            response_text: String(answer),
            is_correct: false,
            points_earned: 0
          });
        }
      }

      if (responsesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('quiz_responses')
          .insert(responsesToInsert);

        if (insertError) {
          console.error('Error saving responses:', insertError);
          showStatus('Error saving responses', 'error');
          submitBtn.disabled = false;
          return;
        }
      }
    }

    // Calculate score (auto-graded questions only)
    let totalScore = 0;
    for (const [questionId, answer] of Object.entries(studentResponses)) {
      const question = currentQuizData.questions.find(q => q.id === questionId);
      if (!question) continue;

      if (question.type === 'multiple-choice') {
        const selectedOption = question.options.find(o => o.id === answer);
        if (selectedOption?.is_correct) {
          totalScore += 1;
        }
      }
    }

    // Update attempt
    const { error: updateError } = await supabase
      .from('quiz_attempts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        score: totalScore,
        time_spent_minutes: currentQuizData.time_limit_minutes 
          ? Math.round((currentQuizData.time_limit_minutes * 60 - timeRemaining) / 60)
          : null
      })
      .eq('id', quizAttempt.id);

    if (updateError) {
      console.error('Error updating attempt:', updateError);
      showStatus('Quiz submitted but with errors', 'warning');
    } else {
      showStatus('Quiz submitted successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/TEMPLATES/FrameHome.html';
      }, 2000);
    }
  } catch (err) {
    console.error('Error submitting quiz:', err);
    showStatus('Error submitting quiz', 'error');
    submitBtn.disabled = false;
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.textContent = message;
  statusDiv.className = `status-message show ${type}`;
  
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 3000);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
