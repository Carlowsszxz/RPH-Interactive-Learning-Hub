import { supabase } from './supabase-auth.js';

// Game state
let gameState = {
  mode: null, // quick, ranked, practice
  questionCount: 0,
  currentQuestion: 0,
  score: 0,
  correctAnswers: 0,
  questions: [],
  answered: false,
  userId: null,
  startTime: null,
  sessionId: null
};

// Sample trivia questions (in production, these would come from Supabase)
const SAMPLE_QUESTIONS = [
  {
    id: 1,
    question: 'What does HTML stand for?',
    options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'],
    correct: 0,
    category: 'Web Development'
  },
  {
    id: 2,
    question: 'Which CSS property is used to add space around the border of an element?',
    options: ['padding', 'margin', 'border-spacing', 'outline'],
    correct: 1,
    category: 'Web Development'
  },
  {
    id: 3,
    question: 'What is the correct syntax for referring to an external script called "xxx.js"?',
    options: ['<script href="xxx.js"></script>', '<script src="xxx.js"></script>', '<script name="xxx.js"></script>', '<script file="xxx.js"></script>'],
    correct: 1,
    category: 'JavaScript'
  },
  {
    id: 4,
    question: 'In JavaScript, which statement is used to create a function?',
    options: ['function myFunc() {}', 'def myFunc() {}', 'func myFunc() {}', 'Function myFunc() {}'],
    correct: 0,
    category: 'JavaScript'
  },
  {
    id: 5,
    question: 'What is the purpose of SQL?',
    options: ['To style web pages', 'To manage databases', 'To create animations', 'To validate forms'],
    correct: 1,
    category: 'Database'
  },
  {
    id: 6,
    question: 'Which of the following is a NoSQL database?',
    options: ['MySQL', 'PostgreSQL', 'MongoDB', 'SQLite'],
    correct: 2,
    category: 'Database'
  },
  {
    id: 7,
    question: 'What does API stand for?',
    options: ['Application Programming Interface', 'Advanced Programming Integration', 'Application Process Interface', 'Advanced Process Integration'],
    correct: 0,
    category: 'Web Development'
  },
  {
    id: 8,
    question: 'Which HTTP method is used to request data from a server?',
    options: ['POST', 'GET', 'PUT', 'DELETE'],
    correct: 1,
    category: 'Web Development'
  },
  {
    id: 9,
    question: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(2^n)'],
    correct: 1,
    category: 'Algorithms'
  },
  {
    id: 10,
    question: 'Which data structure uses LIFO principle?',
    options: ['Queue', 'Stack', 'Tree', 'Graph'],
    correct: 1,
    category: 'Data Structures'
  }
];

// Initialize game
async function initGame() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (user) {
      gameState.userId = user.id;
    }

    setupEventListeners();
    showGameHub();
    loadRecentScores();
  } catch (err) {
    console.error('Error initializing game:', err);
  }
}

function setupEventListeners() {
  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/TEMPLATES/FrameGames.html';
  });

  // Mode selection buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.target.dataset.mode;
      startGame(mode);
    });
  });

  // Game buttons
  document.getElementById('quitBtn').addEventListener('click', quitGame);
  document.getElementById('playAgainBtn').addEventListener('click', () => showGameHub());
  document.getElementById('leaderboardBtn').addEventListener('click', viewLeaderboard);
  document.getElementById('homeBtn').addEventListener('click', () => {
    window.location.href = '/TEMPLATES/FrameGames.html';
  });
}

function startGame(mode) {
  gameState.mode = mode;
  
  // Set question count based on mode
  switch (mode) {
    case 'quick':
      gameState.questionCount = 5;
      break;
    case 'ranked':
      gameState.questionCount = 10;
      break;
    case 'practice':
      gameState.questionCount = 10;
      break;
  }

  // Reset game state
  gameState.currentQuestion = 0;
  gameState.score = 0;
  gameState.correctAnswers = 0;
  gameState.answered = false;
  gameState.startTime = Date.now();

  // Load questions (in production, filter by user's classes)
  gameState.questions = shuffleArray(SAMPLE_QUESTIONS.slice(0, gameState.questionCount));

  // Show game screen
  showGameScreen();
  loadQuestion();
}

function loadQuestion() {
  if (gameState.currentQuestion >= gameState.questions.length) {
    endGame();
    return;
  }

  const question = gameState.questions[gameState.currentQuestion];
  
  // Update progress
  document.getElementById('questionNumber').textContent = 
    `Question ${gameState.currentQuestion + 1} of ${gameState.questionCount}`;
  
  const progress = ((gameState.currentQuestion) / gameState.questionCount) * 100;
  document.getElementById('progressFill').style.width = progress + '%';

  // Display question
  document.getElementById('questionText').textContent = question.question;

  // Display answer options
  const container = document.getElementById('answersContainer');
  container.innerHTML = '';
  
  question.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = option;
    btn.addEventListener('click', () => selectAnswer(index, question.correct));
    container.appendChild(btn);
  });

  // Start timer for question (20 seconds)
  if (gameState.mode !== 'practice') {
    startQuestionTimer();
  }

  gameState.answered = false;
  document.getElementById('feedbackMessage').classList.add('hidden');
}

function selectAnswer(selectedIndex, correctIndex) {
  if (gameState.answered) return;

  gameState.answered = true;

  const buttons = document.querySelectorAll('.answer-btn');
  let isCorrect = false;

  buttons.forEach((btn, index) => {
    if (index === correctIndex) {
      btn.classList.add('correct');
      isCorrect = true;
    } else if (index === selectedIndex && !isCorrect) {
      btn.classList.add('wrong');
    }
    btn.disabled = true;
  });

  if (isCorrect) {
    gameState.correctAnswers++;
    const basePoints = gameState.mode === 'quick' ? 10 : 5;
    gameState.score += basePoints;
    showFeedback('✓ Correct!', 'correct');
  } else {
    showFeedback('✗ Incorrect', 'wrong');
  }

  document.getElementById('currentScore').textContent = gameState.score;

  // Move to next question after delay
  setTimeout(() => {
    gameState.currentQuestion++;
    loadQuestion();
  }, 1500);
}

function startQuestionTimer() {
  let timeLeft = 20;
  const timerEl = document.getElementById('timer');

  const interval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft + 's';

    if (timeLeft <= 0) {
      clearInterval(interval);
      if (!gameState.answered) {
        selectAnswer(-1, gameState.questions[gameState.currentQuestion].correct);
      }
    }
  }, 1000);
}

function showFeedback(message, type) {
  const feedbackEl = document.getElementById('feedbackMessage');
  feedbackEl.textContent = message;
  feedbackEl.className = `feedback-message ${type}`;
}

function endGame() {
  saveGameScore();
  showResultsScreen();
}

async function saveGameScore() {
  if (!gameState.userId) return;

  try {
    const accuracy = Math.round((gameState.correctAnswers / gameState.questionCount) * 100);
    const timeTaken = Math.round((Date.now() - gameState.startTime) / 1000);
    
    // Determine performance grade
    let grade = 'F';
    if (accuracy >= 90) grade = 'A';
    else if (accuracy >= 80) grade = 'B';
    else if (accuracy >= 70) grade = 'C';
    else if (accuracy >= 60) grade = 'D';
    
    const { error } = await supabase.from('game_scores').insert([
      {
        user_id: gameState.userId,
        game_type: 'trivia_battle',
        game_name: `Trivia Battle - ${gameState.mode}`,
        score: gameState.score,
        level: gameState.mode === 'quick' ? 1 : gameState.mode === 'ranked' ? 2 : 3,
        perfect_rounds: gameState.correctAnswers,
        total_rounds: gameState.questionCount,
        accuracy: accuracy,
        time_seconds: timeTaken,
        performance_grade: grade,
        session_id: null  // Set to null if game_sessions table doesn't exist
      }
    ]);

    if (error) {
      console.error('Error saving score:', error);
    } else {
      // Update leaderboard
      updateLeaderboard();
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

function quitGame() {
  if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
    showGameHub();
  }
}

function showGameHub() {
  document.getElementById('gameHub').classList.remove('hidden');
  document.getElementById('gameScreen').classList.add('hidden');
  document.getElementById('resultsScreen').classList.add('hidden');
}

function showGameScreen() {
  document.getElementById('gameHub').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');
  document.getElementById('resultsScreen').classList.add('hidden');
}

function showResultsScreen() {
  const accuracy = Math.round((gameState.correctAnswers / gameState.questionCount) * 100);
  
  document.getElementById('finalScore').textContent = gameState.score;
  document.getElementById('correctCount').textContent = `${gameState.correctAnswers}/${gameState.questionCount}`;
  document.getElementById('accuracy').textContent = accuracy + '%';

  let resultMessage = '';
  if (accuracy === 100) {
    resultMessage = '🎉 Perfect Score! Outstanding!';
  } else if (accuracy >= 80) {
    resultMessage = '🌟 Excellent work!';
  } else if (accuracy >= 60) {
    resultMessage = '👍 Good job!';
  } else {
    resultMessage = '💪 Keep practicing!';
  }

  document.getElementById('resultMessage').textContent = resultMessage;

  document.getElementById('gameHub').classList.add('hidden');
  document.getElementById('gameScreen').classList.add('hidden');
  document.getElementById('resultsScreen').classList.remove('hidden');
}

async function loadRecentScores() {
  try {
    // Get user's best leaderboard entry (only best score)
    const { data, error } = await supabase
      .from('game_leaderboard')
      .select('*')
      .eq('game_type', 'trivia_battle')
      .order('last_played_at', { ascending: false })
      .limit(1);  // Only get the best score entry

    if (error) throw error;

    const list = document.getElementById('scoresList');
    if (!data || data.length === 0) {
      list.innerHTML = '<li class="no-scores">No scores yet. Be the first to play!</li>';
      return;
    }

    // Display only the best score
    list.innerHTML = data.map(score => `
      <li class="score-item">
        <span class="score-mode">best</span>
        <span class="score-points">${score.best_score} pts</span>
        <span class="score-accuracy">${Math.round((score.best_score / 50) * 100)}%</span>
      </li>
    `).join('');
  } catch (err) {
    console.error('Error loading scores:', err);
  }
}

async function updateLeaderboard() {
  if (!gameState.userId) return;

  try {
    // Get all game scores for this user in this game type
    const { data: scores, error: scoresError } = await supabase
      .from('game_scores')
      .select('score, accuracy')
      .eq('user_id', gameState.userId)
      .eq('game_type', 'trivia_battle');

    if (scoresError) throw scoresError;

    if (!scores || scores.length === 0) return;

    const totalPlays = scores.length;
    const bestScore = Math.max(...scores.map(s => s.score));
    const averageScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / totalPlays);

    // Check if leaderboard entry exists
    const { data: leaderboardEntry, error: leaderboardError } = await supabase
      .from('game_leaderboard')
      .select('*')
      .eq('user_id', gameState.userId)
      .eq('game_type', 'trivia_battle')
      .single();

    if (leaderboardError && leaderboardError.code !== 'PGRST116') {
      throw leaderboardError;
    }

    if (leaderboardEntry) {
      // Update existing entry - only update if new best score is better
      if (bestScore > (leaderboardEntry.best_score || 0)) {
        await supabase
          .from('game_leaderboard')
          .update({
            score: bestScore,  // Leaderboard rank by best score
            total_plays: totalPlays,
            average_score: averageScore,
            best_score: bestScore,
            last_played_at: new Date().toISOString()
          })
          .eq('id', leaderboardEntry.id);
      } else {
        // Just update plays and average, don't change score/best_score
        await supabase
          .from('game_leaderboard')
          .update({
            total_plays: totalPlays,
            average_score: averageScore,
            last_played_at: new Date().toISOString()
          })
          .eq('id', leaderboardEntry.id);
      }
    } else {
      // Create new entry with best score as main score
      await supabase
        .from('game_leaderboard')
        .insert([{
          user_id: gameState.userId,
          game_type: 'trivia_battle',
          game_name: 'Trivia Battle',
          score: bestScore,  // Leaderboard rank by best score
          total_plays: totalPlays,
          average_score: averageScore,
          best_score: bestScore,
          last_played_at: new Date().toISOString()
        }]);
    }
  } catch (err) {
    console.error('Error updating leaderboard:', err);
  }
}

function viewLeaderboard() {
  // Show leaderboard modal with top players
  showLeaderboardModal();
}

async function showLeaderboardModal() {
  try {
    // Query without joins to avoid RLS issues
    const { data, error } = await supabase
      .from('game_leaderboard')
      .select('*')
      .eq('game_type', 'trivia_battle')
      .order('best_score', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Get user profile names separately to avoid RLS join issues
    const userIds = data.map(entry => entry.user_id);
    let userProfiles = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      
      if (profiles) {
        profiles.forEach(p => {
          userProfiles[p.id] = p;
        });
      }
    }

    const leaderboardHTML = `
      <div class="leaderboard-modal">
        <div class="leaderboard-content">
          <h2>🏆 Trivia Battle Leaderboard</h2>
          <button class="close-modal">×</button>
          <div class="leaderboard-list">
            ${data.map((entry, index) => {
              const profile = userProfiles[entry.user_id];
              const playerName = profile?.full_name || 'Player';
              return `
              <div class="leaderboard-entry rank-${index + 1}">
                <span class="rank">#${index + 1}</span>
                <span class="player-name">${playerName}</span>
                <span class="best-score">${entry.best_score} pts</span>
                <span class="avg-score">Avg: ${entry.average_score}</span>
              </div>
            `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    const modal = document.createElement('div');
    modal.innerHTML = leaderboardHTML;
    document.body.appendChild(modal);

    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  } catch (err) {
    console.error('Error loading leaderboard:', err);
    alert('Failed to load leaderboard. Please try again.');
  }
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
