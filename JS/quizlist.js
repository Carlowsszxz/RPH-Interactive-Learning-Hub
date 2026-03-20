import { supabase } from './supabase-auth.js';
import { loadNavigation, setupLogout } from './navigation-loader.js';

// Practice Quizzes Data
const practiceQuizzes = [
  {
    id: 'practice-1',
    title: 'Quiz for History Activity 1',
    description: 'Test your knowledge about the Cavite Mutiny - a pivotal event in Philippine history.',
    isPractice: true,
    questions: [
      {
        question: "Which immediate policy change triggered the dissatisfaction of workers in the Cavite arsenal?",
        options: ["Forced military conscription", "Abolition of their exemption from tribute and forced labor", "Closure of Manila ports", "Increase in church taxes"],
        correct: "Abolition of their exemption from tribute and forced labor"
      },
      {
        question: "According to Spanish accounts, the Cavite Mutiny was primarily described as:",
        options: ["A labor strike over wages", "A local misunderstanding during a festival", "A large-scale conspiracy to overthrow Spanish rule", "A religious conflict among priests"],
        correct: "A large-scale conspiracy to overthrow Spanish rule"
      },
      {
        question: "Governor-General Rafael Izquierdo claimed that the mutiny was instigated mainly by:",
        options: ["Chinese merchants", "American traders", "Native clergy and Filipino lawyers", "Spanish soldiers"],
        correct: "Native clergy and Filipino lawyers"
      },
      {
        question: "What signal did Spanish authorities believe was intended to start the uprising in Manila and Cavite?",
        options: ["Church bells from Intramuros", "A coded letter from Madrid", "Rockets/fireworks from Intramuros", "A naval cannon shot"],
        correct: "Rockets/fireworks from Intramuros"
      },
      {
        question: "How did Trinidad Pardo de Tavera interpret the Cavite Mutiny?",
        options: ["A fully organized national revolution", "A foreign-inspired rebellion", "A small military and labor mutiny exaggerated for political reasons", "A purely religious uprising"],
        correct: "A small military and labor mutiny exaggerated for political reasons"
      },
      {
        question: "In Spanish narratives, what role were Gomburza accused of playing?",
        options: ["Neutral observers", "Financial sponsors only", "Spiritual leaders of a religious revival", "Masterminds or leaders of the planned rebellion"],
        correct: "Masterminds or leaders of the planned rebellion"
      },
      {
        question: "Which factor did Filipino accounts emphasize as part of the broader context of discontent?",
        options: ["Spain's defeat in war", "Reforms being discussed that threatened friar power", "The spread of Protestantism", "Discovery of gold in Luzon"],
        correct: "Reforms being discussed that threatened friar power"
      },
      {
        question: "What happened to many Filipino professionals and ilustrados linked to the event?",
        options: ["They were promoted in government", "They were exiled or imprisoned", "They were sent to Spain for education", "They joined the Spanish army"],
        correct: "They were exiled or imprisoned"
      },
      {
        question: "Why is the execution of Gomburza considered historically significant?",
        options: ["It ended Spanish rule immediately", "It caused the closure of all schools", "It awakened Filipino nationalism and influenced later revolutionaries", "It led to peace negotiations"],
        correct: "It awakened Filipino nationalism and influenced later revolutionaries"
      },
      {
        question: "The main difference between Spanish and Filipino accounts of the mutiny lies in how they interpret its:",
        options: ["Location", "Weather conditions", "Scale, intent, and political meaning", "Number of soldiers involved"],
        correct: "Scale, intent, and political meaning"
      }
    ]
  },
  {
    id: 'practice-2',
    title: 'Quiz for Rizal Retraction',
    description: 'Test your knowledge about José Rizal\'s alleged retraction and its historical significance.',
    isPractice: true,
    questions: [
      {
        question: "On what date was the alleged retraction document signed by Rizal?",
        options: ["December 30, 1896", "December 29, 1896", "July 7, 1892", "May 18, 1935"],
        correct: "December 29, 1896"
      },
      {
        question: "Who is the Jesuit friar that claimed to witness Rizal writing the retraction?",
        options: ["Fr. Manuel Garcia", "Fr. Vicente Balaguer", "Fr. March Vilaclara", "Fr. Antonio Luna"],
        correct: "Fr. Vicente Balaguer"
      },
      {
        question: "According to the Cuerpo de Vigilancia report, what did Rizal request first upon entering death row?",
        options: ["Breakfast of eggs and chicken", "A priest to hear confession", "A prayer book", "A meeting with the Katipuneros"],
        correct: "A prayer book"
      },
      {
        question: "What time did Rizal reportedly write the retraction document by himself?",
        options: ["7:50 AM", "10:00 AM", "12:30 PM", "3:00 PM"],
        correct: "12:30 PM"
      },
      {
        question: "Who were present when Rizal finally handed the document he wrote?",
        options: ["Only his counsel", "Jesuit priests and officials from the firing squad", "His lover and a military chaplain", "Fr. Balaguer only"],
        correct: "Jesuit priests and officials from the firing squad"
      },
      {
        question: "Which event happened at 5:00 AM on December 30, 1896, according to the Cuerpo de Vigilancia report?",
        options: ["Rizal was executed", "Rizal's alleged retraction was signed", "His nuptial ceremony at the point of death", "Rizal met Pio Valenzuela"],
        correct: "His nuptial ceremony at the point of death"
      },
      {
        question: "What is significant about the discovery of the 'original' retraction document in 1935?",
        options: ["It confirmed Rizal opposed the revolution", "It surfaced nearly 40 years after his execution", "It was immediately published in Barcelona", "It was written in English"],
        correct: "It surfaced nearly 40 years after his execution"
      },
      {
        question: "According to the Cuerpo de Vigilancia report, what did the Jesuit priests present to Rizal before he wrote the document?",
        options: ["A pre-prepared retraction he initially refused", "A copy of Noli Me Tangere", "Instructions for the Katipunan", "A newspaper article"],
        correct: "A pre-prepared retraction he initially refused"
      },
      {
        question: "Which of the following best describes Rizal's behavior on the day of his execution according to witnesses?",
        options: ["He refused to pray or see priests", "He spoke for a long time with priests, ate lightly, and wrote the document", "He escaped prison briefly", "He immediately signed the pre-prepared retraction without hesitation"],
        correct: "He spoke for a long time with priests, ate lightly, and wrote the document"
      },
      {
        question: "Who was sent to visit Rizal in Dapitan to inform him about the planned revolution?",
        options: ["Antonio Luna", "Fr. Vicente Balaguer", "Pio Valenzuela", "Andrés Bonifacio"],
        correct: "Pio Valenzuela"
      }
    ]
  },
  {
    id: 'practice-3',
    title: 'Quiz for First Mass',
    description: 'Test your knowledge about the First Mass in the Philippines and the historical debate surrounding it.',
    isPractice: true,
    questions: [
      {
        question: "According to the long-standing tradition prior to the 20th century, where was the first Catholic Mass in the Philippines believed to have taken place?",
        options: ["Homonhon", "Butuan", "Cebu", "Limasawa"],
        correct: "Homonhon"
      },
      {
        question: "On what specific date does the Butuan monument claim the first Mass was celebrated?",
        options: ["March 16, 1521", "March 31, 1521", "April 8, 1521", "April 27, 1521"],
        correct: "April 8, 1521"
      },
      {
        question: "Which primary source was a pilot of the ship Trinidad and provided navigational logs including latitudes and directions?",
        options: ["Antonio Pigafetta", "Francisco Albo", "Miguel A. Bernad", "Ferdinand Magellan"],
        correct: "Francisco Albo"
      },
      {
        question: "According to Antonio Pigafetta, on what significant liturgical day was the first Mass celebrated?",
        options: ["Palm Sunday", "Good Friday", "Easter Sunday", "Pentecost Sunday"],
        correct: "Easter Sunday"
      },
      {
        question: "What specific geographical feature is notably absent from the accounts of Mazaua, which serves as a primary argument against the Butuan claim?",
        options: ["A high mountain", "A river", "A coral reef", "A sandy beach"],
        correct: "A river"
      },
      {
        question: "How does the account of Francisco Albo support the Limasawa claim, even though he does not explicitly mention the Mass?",
        options: ["He describes the local king's conversion to Christianity.", "He mentions the specific name \"Limasawa\" in his diary.", "His navigational coordinates and the description of three islands to the west match the geography of Limasawa.", "He recorded the planting of a cross in a riverine settlement."],
        correct: "His navigational coordinates and the description of three islands to the west match the geography of Limasawa."
      },
      {
        question: "Why is Miguel A. Bernad's observation about Pigafetta's later journey to Mindanao significant in this historiographical debate?",
        options: ["It shows Pigafetta was capable of identifying and recording riverine environments when they were actually present.", "It proves Pigafetta never actually visited Mazaua.", "It confirms that the King of Butuan was the one who led the expedition to Cebu.", "It suggests that the expedition stayed in Butuan for more than seven days."],
        correct: "It shows Pigafetta was capable of identifying and recording riverine environments when they were actually present."
      },
      {
        question: "Based on the text, what does the shift from the \"Butuan Claim\" to the \"Limasawa Claim\" illustrate about the nature of historical scholarship?",
        options: ["Historical \"firsts\" are the most important part of national identity.", "Tradition and oral history are more reliable than written logs.", "Historical conclusions are fixed and should not be questioned once a monument is built.", "Historical knowledge is evolving and subject to refinement through rigorous analysis of evidence."],
        correct: "Historical knowledge is evolving and subject to refinement through rigorous analysis of evidence."
      },
      {
        question: "Both the King of Mazaua and the King of Butuan were present at the Mass. How does this detail actually support the Limasawa (Mazaua) claim rather than the Butuan claim?",
        options: ["It indicates the King of Butuan was a visitor to the island of Mazaua, implying Mazaua and Butuan are separate places.", "It suggests the Mass was a secret meeting between the two kings.", "It shows that Magellan had already visited Butuan before arriving at Mazaua.", "It proves that Butuan was an island during the 16th century."],
        correct: "It indicates the King of Butuan was a visitor to the island of Mazaua, implying Mazaua and Butuan are separate places."
      },
      {
        question: "If a new primary source were discovered that placed the \"Mazava\" latitude at 12 degrees north, how would this affect the current historiographical consensus?",
        options: ["It would confirm the Butuan claim once and for all.", "It would force historians to look for a different site further north, as both Limasawa and Butuan are below that latitude.", "It would strengthen the Limasawa claim further.", "It would have no effect because Pigafetta's account is the only one that matters."],
        correct: "It would force historians to look for a different site further north, as both Limasawa and Butuan are below that latitude."
      }
    ]
  },
  {
    id: 'practice-4',
    title: 'Quiz for Cry of Rebellion',
    description: 'Test your knowledge about the Cry of Rebellion and the various historical interpretations surrounding this pivotal event.',
    isPractice: true,
    questions: [
      {
        question: "What was the symbolic act that signified the Filipino rejection of Spanish sovereignty?",
        options: ["The tearing of the cedula", "The singing of the National Anthem", "The signing of the Pact of Biak-na-Bato", "The execution of patriots in Bagumbayan"],
        correct: "The tearing of the cedula"
      },
      {
        question: "Which historian emphasized that the \"Cry\" was defined by the tearing of residence certificates?",
        options: ["Teodoro Agoncillo", "Gregorio Zaide", "Santiago Alvarez", "Milagros Guerrero"],
        correct: "Teodoro Agoncillo"
      },
      {
        question: "According to Pio Valenzuela's later account, where and when did the Cry occur?",
        options: ["Balintawak, August 26, 1896", "Bahay Toro, August 24, 1896", "Pugad Lawin, August 23, 1896", "Kangkong, August 25, 1896"],
        correct: "Pugad Lawin, August 23, 1896"
      },
      {
        question: "Who was the secretary during the meeting described in Guillermo Masangkay's account?",
        options: ["Andres Bonifacio", "Emilio Jacinto", "Apolonio Samson", "Juan Ramos"],
        correct: "Emilio Jacinto"
      },
      {
        question: "Which location was identified by Santiago Alvarez as the site of the Cry?",
        options: ["Tandang Sora's barn", "Bagumbayan", "Pugad Lawin", "Bahay Toro"],
        correct: "Bahay Toro"
      },
      {
        question: "Why is Pio Valenzuela's testimony considered a subject of caution for historians?",
        options: ["He was not present during the actual event.", "He provided conflicting dates and locations in different statements.", "He was a member of the Spanish guardia civil.", "He refused to acknowledge Andres Bonifacio as the leader."],
        correct: "He provided conflicting dates and locations in different statements."
      },
      {
        question: "How do historians Guerrero, Encarnacion, and Villegas explain why there are so many different locations mentioned for the Cry?",
        options: ["The revolutionaries were spread across the entire country simultaneously.", "The different accounts were written by Spanish spies to confuse the public.", "The revolutionaries were constantly moving to evade arrest, leading to multiple gatherings.", "Each province had its own version of the cedula tearing."],
        correct: "The revolutionaries were constantly moving to evade arrest, leading to multiple gatherings."
      },
      {
        question: "Based on the sources, what is the primary reason the Cry of Rebellion is considered a \"crucial turning point\" in Philippine history?",
        options: ["It represented the shift from seeking peaceful reform to open armed revolution.", "It marked the end of the Spanish colonial government.", "It was the day the Philippines was officially granted independence.", "It resulted in the immediate capture of Manila."],
        correct: "It represented the shift from seeking peaceful reform to open armed revolution."
      },
      {
        question: "Comparing the accounts of Masangkay and Valenzuela, what is a major point of consistency between them despite the difference in dates?",
        options: ["Both agree the event happened in Tandang Sora's barn.", "Both highlight the role of the masses and the symbolic destruction of documents.", "Both identify August 26 as the definitive date.", "Both agree the event happened in Tandang Sora's barn."],
        correct: "Both highlight the role of the masses and the symbolic destruction of documents."
      },
      {
        question: "What does the controversy over the \"Cry\" teach us about the nature of historical inquiry?",
        options: ["Only accounts written by Spanish officials are reliable for historical reconstruction.", "Primary sources are always 100% accurate and should not be questioned.", "History is a fixed set of facts that never change regardless of new evidence.", "Historical events can be complex, requiring the critical evaluation of conflicting eyewitness memories."],
        correct: "Historical events can be complex, requiring the critical evaluation of conflicting eyewitness memories."
      }
    ]
  }
];

function fmtDate(d){ if (!d) return 'TBD'; return new Date(d).toLocaleString(); }

function renderQuizList(container, items){
  container.innerHTML = '';
  if (!items || items.length === 0){ 
    container.innerHTML = '<div style="padding: 32px 16px; text-align: center; color: #999; font-size: 14px;"><svg data-lucide="inbox" width="32" height="32" style="display: inline; margin-bottom: 8px; opacity: 0.5;"></svg><div>No quizzes found</div></div>'; 
    return; 
  }
  items.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    
    // Generate icon with first letter or icon
    const icon = document.createElement('div');
    icon.className = 'quiz-card-icon';
    icon.textContent = (q.title || 'Q').charAt(0).toUpperCase();
    
    // Content wrapper
    const content = document.createElement('div');
    content.className = 'quiz-card-content';
    
    // Title
    const title = document.createElement('div');
    title.className = 'quiz-card-title';
    title.textContent = q.title || 'Untitled Quiz';
    content.appendChild(title);
    
    // Description
    const desc = document.createElement('div');
    desc.className = 'quiz-card-desc';
    desc.textContent = (q.description || 'No description provided').slice(0, 200);
    content.appendChild(desc);
    
    // Metadata
    const meta = document.createElement('div');
    meta.className = 'quiz-card-meta';
    
    const timeLimit = q.time_limit_minutes ? `${q.time_limit_minutes} min` : 'No limit';
    meta.innerHTML = `
      <span><svg data-lucide="clock" width="14" height="14"></svg>${timeLimit}</span>
      <span><svg data-lucide="help-circle" width="14" height="14"></svg>${q.questions ? q.questions.length : 0} questions</span>
      <span><span class="quiz-status-badge quiz-status-${q.status || 'active'}">${(q.status || 'active').toUpperCase()}</span></span>
    `;
    content.appendChild(meta);
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'quiz-card-actions';
    
    const startBtn = document.createElement('button');
    startBtn.className = 'quiz-btn quiz-btn-start';
    if (q.isPractice) {
      startBtn.innerHTML = '<svg data-lucide="play" width="14" height="14" style="display: inline; margin-right: 4px; vertical-align: middle;"></svg>Start Quiz';
      startBtn.onclick = (e) => {
        e.preventDefault();
        openPracticeQuiz(q);
      };
    } else {
      startBtn.innerHTML = '<svg data-lucide="play" width="14" height="14" style="display: inline; margin-right: 4px; vertical-align: middle;"></svg>Take Quiz';
      startBtn.onclick = (e) => {
        e.preventDefault();
        window.location.href = '/TEMPLATES/FrameQuizTake.html?id=' + encodeURIComponent(q.id);
      };
    }
    actions.appendChild(startBtn);
    
    card.appendChild(icon);
    card.appendChild(content);
    card.appendChild(actions);
    container.appendChild(card);
  });
  
  // Re-render lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await loadNavigation('nav-container');
  setupLogout();

  if (window.lucide) {
    window.lucide.createIcons();
  }

  const container = document.getElementById('quizList');
  const pageInfo = document.getElementById('pageInfo');
  let currentPage = 1; 
  const perPage = 10;

  async function load(){
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        container.innerHTML = '<div class="p-4 text-red-600">Not authenticated</div>';
        return;
      }

      // Check if user is instructor
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.data.user.id)
        .single();

      const isInstructor = profile?.role === 'instructor';

      const q = document.getElementById('qSearch')?.value.trim() || '';
      const sort = document.getElementById('sortBy')?.value || 'created_at';
      const from = (currentPage-1)*perPage;

      let builder = supabase
        .from('quizzes')
        .select('id, title, description, status, time_limit_minutes, class_id, created_at, created_by')
        .range(from, from + perPage - 1);

      if (isInstructor) {
        // Instructors see all their quizzes regardless of status
        builder = builder.eq('created_by', user.data.user.id);
      } else {
        // Students see active quizzes in their enrolled classes
        const { data: enrollments, error: enrollError } = await supabase
          .from('class_enrollments')
          .select('class_id')
          .eq('user_id', user.data.user.id);

        if (enrollError || !enrollments || enrollments.length === 0) {
          container.innerHTML = '<div class="p-4 text-gray-600">Not enrolled in any classes yet</div>';
          return;
        }

        const classIds = enrollments.map(e => e.class_id);
        builder = builder
          .in('class_id', classIds)
          .eq('status', 'active'); // Only show active quizzes to students
      }

      if (q) {
        builder = builder.ilike('title', `%${q}%`);
      }

      if (sort === 'title') {
        builder = builder.order('title', {ascending:true});
      } else {
        builder = builder.order('created_at', {ascending:false});
      }

      const { data, error } = await builder;
      if (error) throw error;

      // Combine database quizzes with practice quizzes
      const allQuizzes = [...(data || []), ...practiceQuizzes];
      
      renderQuizList(container, allQuizzes || []);
      document.getElementById('quizCount').textContent = (allQuizzes || []).length;
      pageInfo.textContent = currentPage;
    } catch(e) { 
      console.error(e); 
      container.innerHTML = '<div class="p-4 text-red-600">Failed to load quizzes: ' + (e.message || JSON.stringify(e)) + '</div>'; 
    }
  }

  document.getElementById('qSearch')?.addEventListener('input', ()=>{ currentPage=1; load(); });
  document.getElementById('sortBy')?.addEventListener('change', ()=>{ currentPage=1; load(); });
  document.getElementById('prevPage')?.addEventListener('click', ()=>{ if (currentPage>1){ currentPage--; load(); }});
  document.getElementById('nextPage')?.addEventListener('click', ()=>{ currentPage++; load(); });

  // initial load
  load();
});

// Practice Quiz Functions
let currentQuizState = {
  quizData: null,
  currentQuestion: 0,
  answers: {}
};

window.openPracticeQuiz = function(quiz) {
  currentQuizState.quizData = quiz;
  currentQuizState.currentQuestion = 0;
  currentQuizState.answers = {};
  
  document.getElementById('quizTitle').textContent = quiz.title;
  displayQuestion();
  document.getElementById('quizModal').style.display = 'block';
};

window.closeQuizModal = function() {
  document.getElementById('quizModal').style.display = 'none';
};

window.displayQuestion = function() {
  const quiz = currentQuizState.quizData;
  const questionIndex = currentQuizState.currentQuestion;
  const question = quiz.questions[questionIndex];
  
  const progressPercent = ((questionIndex + 1) / quiz.questions.length) * 100;
  
  let html = `
    <div class="quiz-progress-bar">
      <div class="quiz-progress-text">Question ${questionIndex + 1} of ${quiz.questions.length}</div>
      <div class="quiz-progress-fill">
        <div class="quiz-progress-bar-fill" style="width: ${progressPercent}%"></div>
      </div>
    </div>
    
    <div class="quiz-question-container">
      <div class="quiz-question-number">Question ${questionIndex + 1}</div>
      <div class="quiz-question-text">${question.question}</div>
      <div class="quiz-options">
  `;
  
  question.options.forEach(option => {
    const isSelected = currentQuizState.answers[questionIndex] === option;
    html += `
      <div class="quiz-option ${isSelected ? 'selected' : ''}" onclick="selectAnswer(${questionIndex}, '${option.replace(/'/g, "\\'")}')" style="cursor: pointer;">
        ${option}
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
    
    <div class="quiz-button-group">
  `;
  
  if (questionIndex > 0) {
    html += `<button class="quiz-btn" onclick="previousQuestion()" style="flex: 1; padding: 14px 24px; background: white; color: #5C3422; border: 2px solid #E2D5C2; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 14px; transition: all 0.3s ease;" onmouseover="this.style.borderColor='#FF6B35'; this.style.background='#FFF8F0';" onmouseout="this.style.borderColor='#E2D5C2'; this.style.background='white';">Previous</button>`;
  }
  
  if (questionIndex < quiz.questions.length - 1) {
    html += `<button class="quiz-btn quiz-btn-submit" onclick="nextQuestion()">Next</button>`;
  } else {
    html += `<button class="quiz-btn quiz-btn-submit" onclick="submitQuiz()">Submit Quiz</button>`;
  }
  
  html += `
    </div>
  `;
  
  document.getElementById('quizContent').innerHTML = html;
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
};

window.selectAnswer = function(questionIndex, answer) {
  currentQuizState.answers[questionIndex] = answer;
  displayQuestion();
};

window.nextQuestion = function() {
  if (currentQuizState.currentQuestion < currentQuizState.quizData.questions.length - 1) {
    currentQuizState.currentQuestion++;
    displayQuestion();
  }
};

window.previousQuestion = function() {
  if (currentQuizState.currentQuestion > 0) {
    currentQuizState.currentQuestion--;
    displayQuestion();
  }
};

window.submitQuiz = function() {
  const quiz = currentQuizState.quizData;
  let correctCount = 0;
  
  quiz.questions.forEach((q, index) => {
    if (currentQuizState.answers[index] === q.correct) {
      correctCount++;
    }
  });
  
  const percentage = Math.round((correctCount / quiz.questions.length) * 100);
  
  let message = '';
  if (percentage === 100) {
    message = 'Perfect score! Excellent work!';
  } else if (percentage >= 80) {
    message = 'Great job! You did very well.';
  } else if (percentage >= 60) {
    message = 'Good effort! Keep studying.';
  } else {
    message = 'Keep practicing! Review the material.';
  }
  
  const resultsHtml = `
    <div class="quiz-results">
      <div class="quiz-results-score">${percentage}%</div>
      <div class="quiz-results-text">You got ${correctCount} out of ${quiz.questions.length} questions correct!</div>
      <div style="color: #7A5B47; margin-bottom: 24px; font-size: 14px;">${message}</div>
      <button class="quiz-btn quiz-btn-submit" onclick="closeQuizModal()" style="margin: 0 auto; display: block;">Close</button>
    </div>
  `;
  
  document.getElementById('quizContent').innerHTML = resultsHtml;
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
};

// Close modal when clicking outside of it
window.onclick = function(event) {
  const modal = document.getElementById('quizModal');
  if (event.target == modal) {
    modal.style.display = 'none';
  }
};
