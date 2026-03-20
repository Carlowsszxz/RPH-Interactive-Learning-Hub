// Tasks Data
const tasksData = [
  // Cavite Mutiny - Timeline
  {
    id: 'cavite-timeline',
    title: 'Cavite Mutiny: Timeline',
    topic: 'cavite',
    type: 'timeline',
    icon: '📅',
    description: 'Arrange the events of the Cavite Mutiny in chronological order',
    estimatedTime: '8 min',
    difficulty: 'Easy',
    completed: false,
    content: {
      reading: 'Spanish authorities removed long-enjoyed privileges (like tax exemption and forced labor exemption) of Filipino workers and soldiers in the Cavite arsenal. Discontent grew among arsenal workers and troops, leading to plans of protest against the new policies.',
      task: 'Arrange the following events in chronological order:',
      timeline: [
        { date: 'January 20, 1872', event: 'The mutiny broke out at Fort San Felipe in Cavite, led by Sergeant La Madrid and fellow soldiers.' },
        { date: '1872', event: 'Spanish authorities removed long-enjoyed privileges of Filipino workers and soldiers in the Cavite arsenal.' },
        { date: 'February 17, 1872', event: 'Gomburza (Gomez, Burgos, and Zamora) were executed, which fueled Filipino nationalism.' },
        { date: 'After January 20', event: 'The Spanish government quickly suppressed the uprising and arrested many Filipinos, including priests.' }
      ]
    }
  },

  // Cavite Mutiny - Narrative
  {
    id: 'cavite-narrative',
    title: 'Cavite Mutiny: Complete the Historical Narrative',
    topic: 'cavite',
    type: 'narrative',
    icon: '📝',
    description: 'Complete the historical narrative of the Cavite Mutiny',
    estimatedTime: '10 min',
    difficulty: 'Medium',
    completed: false,
    content: {
      passage: 'In {0}, Filipino soldiers and workers at the arsenal in {1} became angry after Spanish authorities removed their {2}. These changes were ordered by Governor-General {3}. On {4}, the mutiny broke out at {5}, led by {6}. However, the Spanish quickly {7} the uprising. As consequences, many Filipinos were arrested, including priests known as {8}, who were executed on {9}, further fueling Filipino nationalism.',
      blanks: [
        { hint: 'Year of the Cavite Mutiny', answer: '1872' },
        { hint: 'Location of the arsenal', answer: 'Cavite' },
        { hint: 'What were removed? (plural)', answer: 'privileges' },
        { hint: 'Spanish official who ordered the changes', answer: 'Rafael de Izquierdo' },
        { hint: 'Date of the mutiny outbreak', answer: 'January 20, 1872' },
        { hint: 'Fort where mutiny occurred (Fort ___ Felipe)', answer: 'San Felipe' },
        { hint: 'Who led the uprising? (Rank ___)', answer: 'Sergeant La Madrid' },
        { hint: 'Spanish authorities did what to the uprising? (verb)', answer: 'suppressed' },
        { hint: 'Nickname for the three executed priests (___burza)', answer: 'Gomburza' },
        { hint: 'Date of execution', answer: 'February 17, 1872' }
      ],
      task: 'Fill in the blanks to complete the historical narrative of the Cavite Mutiny.'
    }
  },

  // Cavite Mutiny - Multiple Choice
  {
    id: 'cavite-mc',
    title: 'Cavite Mutiny: Historical Figures',
    topic: 'cavite',
    type: 'multiple-choice',
    icon: '❓',
    description: 'Identify the correct descriptions of key figures',
    estimatedTime: '5 min',
    difficulty: 'Easy',
    completed: false,
    content: {
      reading: 'The Cavite Mutiny involved several key figures including soldiers, priests, and Spanish officials.',
      questions: [
        {
          id: 'cavite-q1',
          number: 1,
          text: 'Mariano Gomez',
          options: [
            { text: 'Spanish governor-general who removed privileges of workers', correct: false },
            { text: 'Filipino priest, elderly member of Gomburza executed in 1872', correct: true },
            { text: 'Soldier who led the Cavite uprising', correct: false },
            { text: 'Jesuit priest who visited Rizal', correct: false }
          ]
        },
        {
          id: 'cavite-q2',
          number: 2,
          text: 'Jose Burgos',
          options: [
            { text: 'Parish priest accused in the mutiny; advocate of secularization', correct: true },
            { text: 'Governor of Cavite during the mutiny', correct: false },
            { text: 'Leader of the Katipunan', correct: false },
            { text: 'Spanish military commander in Fort San Felipe', correct: false }
          ]
        },
        {
          id: 'cavite-q3',
          number: 3,
          text: 'Jacinto Zamora',
          options: [
            { text: 'Filipino soldier who started the revolt', correct: false },
            { text: 'Priest executed with Gomez and Burgos despite weak evidence', correct: true },
            { text: 'Governor-General who imposed new taxes', correct: false },
            { text: 'Historian who wrote about the mutiny', correct: false }
          ]
        },
        {
          id: 'cavite-q4',
          number: 4,
          text: 'Rafael de Izquierdo',
          options: [
            { text: 'Filipino reformist writer', correct: false },
            { text: 'Leader of the Cavite arsenal workers', correct: false },
            { text: 'Spanish Governor-General who removed privileges and tightened policies', correct: true },
            { text: 'Parish priest of Bacoor', correct: false }
          ]
        },
        {
          id: 'cavite-q5',
          number: 5,
          text: 'Sergeant La Madrid',
          options: [
            { text: 'Priest accused in the Cavite Mutiny', correct: false },
            { text: 'Filipino soldier who led the uprising at Fort San Felipe', correct: true },
            { text: 'Spanish judge during the trials', correct: false },
            { text: 'Katipunan member in 1896', correct: false }
          ]
        }
      ]
    }
  },

  // First Mass - Multiple Choice
  {
    id: 'first-mass-mc',
    title: 'First Mass: Historical Figures',
    topic: 'first-mass',
    type: 'multiple-choice',
    icon: '❓',
    description: 'Identify the key figures of the First Mass',
    estimatedTime: '5 min',
    difficulty: 'Easy',
    completed: false,
    content: {
      reading: 'The First Mass in the Philippines in 1521 involved several key figures from the Spanish expedition and local rulers.',
      questions: [
        {
          id: 'first-q1',
          number: 1,
          text: 'Ferdinand Magellan',
          options: [
            { text: 'Italian scholar who recorded the voyage', correct: false },
            { text: 'Spanish governor in the Philippines', correct: false },
            { text: 'Portuguese explorer who led the expedition that reached the Philippines in 1521', correct: true },
            { text: 'Local chieftain who welcomed the Spaniards', correct: false }
          ]
        },
        {
          id: 'first-q2',
          number: 2,
          text: 'Antonio Pigafetta',
          options: [
            { text: 'Soldier who fought in Mactan', correct: false },
            { text: 'Chronicler who documented Magellan\'s voyage and the First Mass', correct: true },
            { text: 'Priest who celebrated the First Mass', correct: false },
            { text: 'Rajah of Limasawa', correct: false }
          ]
        },
        {
          id: 'first-q3',
          number: 3,
          text: 'Rajah Kolambu',
          options: [
            { text: 'Spanish missionary priest', correct: false },
            { text: 'Local ruler who welcomed Magellan and attended the Mass', correct: true },
            { text: 'Captain of Magellan\'s ship', correct: false },
            { text: 'Historian who wrote about the expedition', correct: false }
          ]
        },
        {
          id: 'first-q4',
          number: 4,
          text: 'Rajah Siagu',
          options: [
            { text: 'Native ruler of Limasawa who was present during the First Mass', correct: true },
            { text: 'Portuguese sailor who navigated the fleet', correct: false },
            { text: 'Spanish soldier assigned in Cebu', correct: false },
            { text: 'Leader of the Cavite Mutiny', correct: false }
          ]
        },
        {
          id: 'first-q5',
          number: 5,
          text: 'Fr. Pedro de Valderrama',
          options: [
            { text: 'Explorer who discovered the Pacific route', correct: false },
            { text: 'Priest who officiated the First Catholic Mass in 1521', correct: true },
            { text: 'Local datu who traded with Magellan', correct: false },
            { text: 'Interpreter between Spaniards and natives', correct: false }
          ]
        }
      ]
    }
  },

  // First Mass - Narrative
  {
    id: 'first-mass-narrative',
    title: 'First Mass: The Historic Moment',
    topic: 'first-mass',
    type: 'narrative',
    icon: '📝',
    description: 'Describe the significance of the First Mass in 1521',
    estimatedTime: '10 min',
    difficulty: 'Medium',
    completed: false,
    content: {
      passage: 'On {0}, the First Catholic Mass in the Philippines was celebrated on the island of {1}. It was attended by explorer {2} and his crew, along with local rulers including {3} and {{4}}. The Mass was officiated by {{5}}. This event marked the beginning of {{6}} in the Philippines and is significant because it symbolized the {{7}} of Western and Eastern cultures.',
      blanks: [
        { hint: 'Date (March ___, 1521)', answer: 'March 31, 1521' },
        { hint: 'Which island?', answer: 'Limasawa' },
        { hint: 'Portuguese explorer (_____ Magellan)', answer: 'Ferdinand Magellan' },
        { hint: 'First local ruler present (Rajah _____)', answer: 'Kolambu' },
        { hint: 'Second local ruler present (Rajah _____)', answer: 'Siagu' },
        { hint: 'Who was the priest? (Fr. _____ de Valderrama)', answer: 'Pedro de Valderrama' },
        { hint: 'What began? (_____ colonization)', answer: 'Spanish colonization' },
        { hint: 'Blending of cultures (_____ and synthesis)', answer: 'fusion' }
      ],
      task: 'Fill in the blanks to complete the narrative of the First Mass.'
    }
  },

  // Rizal Retraction - Multiple Choice
  {
    id: 'rizal-mc',
    title: 'Rizal Retraction: Historical Figures',
    topic: 'rizal',
    type: 'multiple-choice',
    icon: '❓',
    description: 'Identify the key figures in Rizal\'s retraction',
    estimatedTime: '5 min',
    difficulty: 'Medium',
    completed: false,
    content: {
      reading: 'Jose Rizal\'s retraction before his execution on December 30, 1896, remains a controversial topic. Several Jesuit priests visited him in Fort Santiago.',
      questions: [
        {
          id: 'rizal-q1',
          number: 1,
          text: 'Jose Rizal',
          options: [
            { text: 'Filipino nationalist executed at Bagumbayan; visited by Jesuits before execution', correct: true },
            { text: 'Spanish governor who ordered Rizal\'s arrest', correct: false },
            { text: 'Jesuit priest who wrote Rizal\'s biography', correct: false },
            { text: 'Filipino soldier involved in Cavite Mutiny', correct: false }
          ]
        },
        {
          id: 'rizal-q2',
          number: 2,
          text: 'Fr. Vicente Balaguer',
          options: [
            { text: 'Rizal\'s friend who hid his writings', correct: false },
            { text: 'Jesuit priest who visited Rizal in Fort Santiago and claimed Rizal retracted', correct: true },
            { text: 'Spanish general who sentenced Rizal to death', correct: false },
            { text: 'Katipunan leader during the revolution', correct: false }
          ]
        },
        {
          id: 'rizal-q3',
          number: 3,
          text: 'Governor-General Camilo de Polavieja',
          options: [
            { text: 'Spanish official who presided over Rizal\'s trial and execution', correct: true },
            { text: 'Chronicler of the retraction document', correct: false },
            { text: 'Filipino reformist advocating secularization', correct: false },
            { text: 'Priest executed during Cavite Mutiny', correct: false }
          ]
        },
        {
          id: 'rizal-q4',
          number: 4,
          text: 'Jesuit Priests (visiting Rizal)',
          options: [
            { text: 'Priests who visited Rizal in Fort Santiago and assisted with his retraction', correct: true },
            { text: 'Writers who exposed the Katipunan', correct: false },
            { text: 'Soldiers who protected Rizal', correct: false },
            { text: 'Priests executed in Cavite Mutiny', correct: false }
          ]
        },
        {
          id: 'rizal-q5',
          number: 5,
          text: 'Witnesses of Retraction Document',
          options: [
            { text: 'Verified Rizal\'s retraction document after 1935 discovery', correct: true },
            { text: 'Soldiers in Cavite arsenal', correct: false },
            { text: 'Leaders of the Philippine Revolution', correct: false },
            { text: 'Local chieftains during First Mass', correct: false }
          ]
        }
      ]
    }
  },

  // Rizal Retraction - Narrative
  {
    id: 'rizal-narrative',
    title: 'Rizal Retraction: A Controversial Legacy',
    topic: 'rizal',
    type: 'narrative',
    icon: '📝',
    description: 'Analyze the significance and controversy of Rizal\'s retraction',
    estimatedTime: '12 min',
    difficulty: 'Hard',
    completed: false,
    content: {
      passage: 'Jose Rizal was executed on {0} at {{1}}. Before his execution, {{2}} reportedly signed a document {{3}} his nationalist and anti-Catholic writings. This retraction was allegedly witnessed by {{4}}. This event remains historically {{5}} because some scholars view it as {{6}}, while others see it as {{7}}. Regardless, Rizal\'s {{8}} and {{9}} continue to inspire contemporary Filipino nationalism.',
      blanks: [
        { hint: 'Execution date (December ___, 1896)', answer: 'December 30, 1896' },
        { hint: 'Where was he executed? (_____ / Bagumbayan)', answer: 'Fort Santiago' },
        { hint: 'Who signed the retraction?', answer: 'Jose Rizal' },
        { hint: 'What did he do? (verb: removing or taking back)', answer: 'retracting' },
        { hint: 'Who witnessed it?', answer: 'Jesuit priests' },
        { hint: 'Adjective describing the debate', answer: 'controversial' },
        { hint: 'Viewed as genuine or _____ (verb)', answer: 'authentic' },
        { hint: 'Viewed as a _____ or fabrication', answer: 'hoax' },
        { hint: 'What legacies inspire? (_____ and writings)', answer: 'legacy' },
        { hint: 'What continues to inspire? (his life and _____)', answer: 'ideals' }
      ],
      task: 'Fill in the blanks to complete the narrative about Rizal\'s retraction and its historical controversy.'
    }
  },

  // Cry of Rebellion - Timeline
  {
    id: 'cry-timeline',
    title: 'Cry of Rebellion: Timeline',
    topic: 'cry',
    type: 'timeline',
    icon: '📅',
    description: 'Arrange the events of the Cry of Rebellion in order',
    estimatedTime: '8 min',
    difficulty: 'Easy',
    completed: false,
    content: {
      reading: 'The Cry of Rebellion (Cry of Pugad Lawin or Balintawak) marked the beginning of the Philippine Revolution in 1896.',
      task: 'Arrange the following events in chronological order:',
      timeline: [
        { date: '1892-1896', event: 'The Katipunan, a secret revolutionary society, was organized and grew in membership.' },
        { date: 'August 1896', event: 'The Katipunan was discovered by Spanish authorities in Manila.' },
        { date: 'August 23, 1896', event: 'Andres Bonifacio gathered fellow revolutionaries in Pugad Lawin to plan the revolt.' },
        { date: 'August 26, 1896', event: 'The revolutionaries tore their cedulas as a symbolic act of defiance.' },
        { date: 'August 1896', event: 'The Cry of Pugad Lawin officially signaled the start of the Philippine Revolution.' }
      ]
    }
  },

  // Cry of Rebellion - Multiple Choice
  {
    id: 'cry-mc',
    title: 'Cry of Rebellion: Revolutionary Leaders',
    topic: 'cry',
    type: 'multiple-choice',
    icon: '❓',
    description: 'Identify key revolutionary leaders and their roles',
    estimatedTime: '6 min',
    difficulty: 'Medium',
    completed: false,
    content: {
      reading: 'The Cry of Rebellion involved several revolutionary leaders who played crucial roles in initiating the Philippine Revolution.',
      questions: [
        {
          id: 'cry-q1',
          number: 1,
          text: 'Andres Bonifacio',
          options: [
            { text: 'Founder of the Katipunan; led the Cry of Pugad Lawin and tore cedulas', correct: true },
            { text: 'Spanish governor-general who suppressed the revolt', correct: false },
            { text: 'Filipino priest executed during Cavite Mutiny', correct: false },
            { text: 'Chronicler of the Philippine Revolution', correct: false }
          ]
        },
        {
          id: 'cry-q2',
          number: 2,
          text: 'Emilio Jacinto',
          options: [
            { text: 'Bonifacio\'s advisor; wrote the "Kartilya ng Katipunan" and guided revolutionary strategies', correct: true },
            { text: 'Soldier who led a failed uprising in Cavite', correct: false },
            { text: 'Spanish military commander in Manila', correct: false },
            { text: 'Priest who officiated religious ceremonies during the revolution', correct: false }
          ]
        },
        {
          id: 'cry-q3',
          number: 3,
          text: 'Melchora Aquino (Tandang Sora)',
          options: [
            { text: 'Provided food, shelter, and medical care to Katipuneros; called the "Mother of the Revolution"', correct: true },
            { text: 'Revolutionary who led attacks in Manila', correct: false },
            { text: 'Governor-General of the Philippines', correct: false },
            { text: 'Chronicler of Rizal\'s execution', correct: false }
          ]
        },
        {
          id: 'cry-q4',
          number: 4,
          text: 'Teodoro Plata',
          options: [
            { text: 'Early Katipunan member who helped organize meetings and logistics', correct: true },
            { text: 'Leader of Spanish forces during Cavite Mutiny', correct: false },
            { text: 'Priest executed with Gomburza', correct: false },
            { text: 'Writer of Rizal\'s retraction document', correct: false }
          ]
        },
        {
          id: 'cry-q5',
          number: 5,
          text: 'Katipunan Members (general)',
          options: [
            { text: 'Participated in tearing cedulas and initiating uprisings in multiple provinces', correct: true },
            { text: 'Spanish soldiers who defended Manila', correct: false },
            { text: 'Jesuit priests visiting Rizal', correct: false },
            { text: 'Local rulers during First Mass', correct: false }
          ]
        }
      ]
    }
  },

  // Cry of Rebellion - Narrative
  {
    id: 'cry-narrative',
    title: 'Cry of Rebellion: The Birth of the Philippine Revolution',
    topic: 'cry',
    type: 'narrative',
    icon: '📝',
    description: 'Describe the significance of the Cry of Rebellion',
    estimatedTime: '10 min',
    difficulty: 'Medium',
    completed: false,
    content: {
      passage: 'The Cry of Rebellion in {{0}} {{1}} marked the official beginning of the {{2}}. It was led by {{3}} and the secret {{4}}. The revolutionaries gathered at {{5}} (also called {{6}}) and performed the symbolic act of {{7}} as defiance against Spanish colonial rule. This event sparked {{8}} throughout the Philippines and became a {{9}} for Filipino nationalism.',
      blanks: [
        { hint: 'Month and year (August ____)', answer: 'August 1896' },
        { hint: 'What was it called? (Cry of _____ Lawin)', answer: 'Pugad' },
        { hint: 'What revolution began?', answer: 'Philippine Revolution' },
        { hint: 'Who was the main leader?', answer: 'Andres Bonifacio' },
        { hint: 'What was the secret society? (_____ Society)', answer: 'Katipunan' },
        { hint: 'Location (Pugad Lawin or _____)', answer: 'Balintawak' },
        { hint: 'Alternative name for the location', answer: 'Balintawak' },
        { hint: 'What did they tear as a symbol? (_____ or cedulas)', answer: 'cedulas' },
        { hint: 'What happened? (_____ throughout)', answer: 'uprisings' },
        { hint: 'Final word: It became a _____ for nationalism', answer: 'symbol' }
      ],
      task: 'Fill in the blanks to complete the narrative of the Cry of Rebellion.'
    }
  }
];

// Initialize tasks
let currentFilter = 'all';
let currentTask = null;
let answers = {};
let taskScore = 0;
let taskAnswered = false;

// Toast Notification System
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠'
  };
  
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('remove');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Format difficulty for display
function formatDifficulty(difficulty) {
  const map = {
    'easy': 'Easy',
    'medium': 'Medium',
    'hard': 'Hard'
  };
  return map[difficulty?.toLowerCase()] || difficulty;
}

// Load tasks on page load
document.addEventListener('DOMContentLoaded', () => {
  renderTasksByTopic();
  loadAnswers();
  updateProgress();
  closeAllAccordions();
  lucide.createIcons();
});

// Topic mapping for display
const topicNames = {
  'cavite': '🏰 Cavite Mutiny',
  'first-mass': '⛪ First Mass',
  'rizal': '✍️ Rizal Retraction',
  'cry': '🔔 Cry of Rebellion'
};

// Format task type for display
function formatType(type) {
  const map = {
    'timeline': '📅 Timeline',
    'multiple-choice': '❓ Multiple Choice',
    'narrative': '📝 Narrative'
  };
  return map[type] || type;
}

// Render tasks organized by topic with accordion
function renderTasksByTopic() {
  const container = document.getElementById('tasksContainer');
  
  // Group tasks by topic
  const groupedTasks = {};
  tasksData.forEach(task => {
    if (!groupedTasks[task.topic]) {
      groupedTasks[task.topic] = [];
    }
    groupedTasks[task.topic].push(task);
  });

  // Apply filter
  let selectedTopics = Object.keys(groupedTasks);
  
  if (currentFilter !== 'all' && currentFilter !== 'timeline' && currentFilter !== 'multiple-choice' && currentFilter !== 'narrative') {
    // Filter by topic
    selectedTopics = selectedTopics.filter(topic => topic === currentFilter);
  } else if (currentFilter !== 'all') {
    // Filter by type - show all topics but only their matching tasks
    // We'll filter at the task level instead
  }

  if (selectedTopics.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #7A5B47;">
        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📭</div>
        <div style="font-size: 16px;">No tasks found for this filter</div>
      </div>
    `;
    return;
  }

  container.innerHTML = selectedTopics.map(topic => {
    let topicTasks = groupedTasks[topic];
    
    // Apply type filter if selected
    if (currentFilter !== 'all' && (currentFilter === 'timeline' || currentFilter === 'multiple-choice' || currentFilter === 'narrative')) {
      topicTasks = topicTasks.filter(t => t.type === currentFilter);
    }
    
    if (topicTasks.length === 0) return '';
    
    return `
      <div class="accordion-item">
        <button class="accordion-header active" onclick="toggleAccordion(this)">
          <div class="accordion-icon">
            <span>${topicNames[topic]}</span>
            <span style="font-size: 12px; color: inherit; opacity: 0.8;">(${topicTasks.length})</span>
          </div>
          <span class="accordion-chevron">▼</span>
        </button>
        <div class="accordion-content active">
          <div class="accordion-body">
            ${topicTasks.map(task => `
              <div class="accordion-task-card" onclick="openTaskModal('${task.id}')">
                <div class="accordion-task-card-header">
                  <div class="accordion-task-icon">${task.icon}</div>
                </div>
                <div class="accordion-task-title">${task.title}</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                  <span class="accordion-task-badge ${task.type === 'multiple-choice' ? 'multiple-choice' : (task.type === 'narrative' ? 'narrative' : '')}">${formatType(task.type)}</span>
                  <span class="difficulty-badge ${task.difficulty?.toLowerCase() || 'easy'}">${formatDifficulty(task.difficulty)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 12px; color: #A0826D;">⏱️ ${task.estimatedTime}</span>
                  <div class="accordion-task-status ${answers[task.id] ? 'completed' : ''}">
                    ${answers[task.id] ? '✓ Completed' : 'Not Started'}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// Toggle accordion
function toggleAccordion(header) {
  // Make sure we're working with the button element
  const button = header.closest('.accordion-header') || header;
  const content = button.nextElementSibling;
  
  if (!content) return;
  
  // Toggle active class on both header and content
  button.classList.toggle('active');
  content.classList.toggle('active');
  
  // Prevent propagation
  event.stopPropagation();
}

// Setup filter buttons
function setupFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      renderTasksByTopic();
    });
  });
}

// Open task modal
function openTaskModal(taskId) {
  currentTask = tasksData.find(t => t.id === taskId);
  taskAnswered = false;
  if (!currentTask) return;

  const modal = document.getElementById('taskModal');
  const modalTitle = document.getElementById('modalTitle');
  const taskInfoBar = document.getElementById('taskInfoBar');
  const modalBody = document.getElementById('modalBody');
  const taskInstructions = document.getElementById('taskInstructions');
  const taskResults = document.getElementById('taskResults');
  const actionsContainer = document.getElementById('actionsContainer');
  
  // Hide results initially
  taskResults.style.display = 'none';
  actionsContainer.style.display = 'flex';

  modalTitle.textContent = currentTask.title;
  
  // Add task info bar
  taskInfoBar.innerHTML = `
    <div class="task-info-item">
      <strong>${formatType(currentTask.type)}</strong>
    </div>
    <div class="task-info-item">
      ⏱️ <strong>${currentTask.estimatedTime}</strong>
    </div>
    <div class="task-info-item">
      <span class="difficulty-badge ${currentTask.difficulty?.toLowerCase() || 'easy'}">${formatDifficulty(currentTask.difficulty)}</span>
    </div>
  `;
  
  // Add task instructions
  const instructionMap = {
    'timeline': {
      icon: '📅',
      title: 'Timeline Task',
      text: 'Arrange the events in the correct chronological order by dragging them. When finished, submit your answer to see your score.'
    },
    'multiple-choice': {
      icon: '❓',
      title: 'Multiple Choice',
      text: 'Select the correct answer for each question. You\'ll receive immediate feedback when you submit.'
    },
    'narrative': {
      icon: '📝',
      title: 'Fill in the Blanks',
      text: 'Read the passage and fill in each blank with the correct answer. Use the hints provided to help guide your responses.'
    }
  };
  
  const instruction = instructionMap[currentTask.type] || instructionMap['multiple-choice'];
  taskInstructions.innerHTML = `
    <div class="task-instructions-icon">${instruction.icon}</div>
    <div class="task-instructions-content">
      <div class="task-instructions-title">${instruction.title}</div>
      <div class="task-instructions-text">${instruction.text}</div>
    </div>
  `;
  
  let content = '';
  
  // Add reading section
  if (currentTask.content.reading) {
    content += `
      <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #E2D5C2;">
        <h3 style="font-size: 13px; font-weight: 700; color: #FF6B35; text-transform: uppercase; margin-bottom: 12px;">📖 Background</h3>
        <div style="font-size: 13px; color: #3D3D3D; line-height: 1.6; background: #FAFAF8; padding: 16px; border-radius: 12px; border-left: 4px solid #FDC830;">${currentTask.content.reading}</div>
      </div>
    `;
  }

  // Add task specific content
  if (currentTask.type === 'timeline') {
    content += renderTimeline();
  } else if (currentTask.type === 'multiple-choice') {
    content += renderMultipleChoice();
  } else if (currentTask.type === 'narrative') {
    content += renderNarrative();
  }

  modalBody.innerHTML = content;
  modal.classList.add('active');
  
  lucide.createIcons();
}

// Render timeline content
function renderTimeline() {
  const timeline = currentTask.content.timeline;
  return `
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 13px; font-weight: 700; color: #FF6B35; text-transform: uppercase; margin-bottom: 16px;">📋 Arrange events in chronological order</h3>
      <div style="background: linear-gradient(135deg, #FFFBF7 0%, #FFF8F3 100%); padding: 16px; border-radius: 12px; border: 2px dashed #FDC830; margin-bottom: 16px;">
        <p style="font-size: 12px; color: #5C3422; margin-bottom: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <span style="background: #FF6B35; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">💡</span>
          Drag and drop each event to order them chronologically (oldest to newest)
        </p>
      </div>
      <div style="background: #FAFAF8; padding: 16px; border-radius: 12px; border: 2px solid #E2D5C2; margin-bottom: 16px;">
        <div class="timeline-droppable" id="timelineContainer">
          ${timeline.map((item, idx) => `
            <div class="timeline-item draggable" draggable="true" data-index="${idx}" ondragstart="handleTimelineDragStart(event)" ondragend="handleTimelineDragEnd(event)" ondragover="handleTimelineDragOver(event)" ondrop="handleTimelineDrop(event)">
              <div class="timeline-dot" style="cursor: grab; user-select: none; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #FF6B35; color: white; border-radius: 50%; font-weight: bold; font-size: 12px;">${idx + 1}</div>
              <div>
                <div class="timeline-date" style="font-weight: 700; color: #FF6B35; font-size: 12px;">${item.date}</div>
                <div class="timeline-text" style="color: #3D3D3D; font-size: 13px; line-height: 1.5;">${item.event}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="background: #FAFAF8; padding: 12px; border-radius: 8px; border-left: 4px solid #FF6B35; font-size: 12px; color: #5C3422;">
        <strong>💬 Tip:</strong> You can see the drag handles (numbered circles). Rearrange them to match the correct historical sequence.
      </div>
    </div>
  `;
}

// Render multiple choice content
function renderMultipleChoice() {
  const { questions } = currentTask.content;
  return `
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 13px; font-weight: 700; color: #FF6B35; text-transform: uppercase; margin-bottom: 16px;">❓ Answer the following questions</h3>
      <div id="questionProgressBar" style="margin-bottom: 16px; padding: 12px; background: #FAFAF8; border-radius: 8px; display: none;">
        <span style="font-size: 12px; color: #5C3422; font-weight: 600;" id="questionProgress"></span>
      </div>
      <div>
        ${questions.map((q, qIdx) => `
          <div class="question-item" id="question-${q.id}">
            <div class="question-number">Question ${q.number} of ${questions.length}</div>
            <div class="question-text">${q.text}</div>
            <div class="options">
              ${q.options.map((opt, idx) => `
                <div class="option" data-question="${q.id}" data-option="${idx}" data-correct="${opt.correct}" onclick="selectOption(this)">
                  ${opt.text}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Render narrative content
function renderNarrative() {
  const { passage, blanks, task } = currentTask.content;
  const savedAnswers = answers[currentTask.id] || {};
  
  // Create a passage with input fields for blanks
  let passageHTML = passage;
  
  blanks.forEach((blank, idx) => {
    const savedValue = (savedAnswers && savedAnswers[idx]) || '';
    const inputId = `blank-${idx}`;
    const inputField = `<input type="text" id="${inputId}" class="fill-blank-input" data-index="${idx}" value="${savedValue}" placeholder="Blank ${idx + 1}" title="${blank.hint}">`;
    passageHTML = passageHTML.replace(`{${idx}}`, inputField);
  });
  
  return `
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 13px; font-weight: 700; color: #FF6B35; text-transform: uppercase; margin-bottom: 12px;">📖 ${task}</h3>
      <div style="font-size: 13px; color: #3D3D3D; line-height: 1.8; background: #FAFAF8; padding: 20px; border-radius: 12px; border-left: 4px solid #FDC830; margin-bottom: 20px;">
        ${passageHTML}
      </div>
      
      <div style="background: white; padding: 16px; border-radius: 12px; border: 2px solid #E2D5C2;">
        <h4 style="font-size: 12px; font-weight: 700; color: #5C3422; margin-bottom: 12px;">📌 Hints (Hover over blanks or check below):</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          ${blanks.map((blank, idx) => `
            <div style="padding: 12px; background: linear-gradient(135deg, #FFFBF7 0%, #FFF8F3 100%); border-radius: 8px; border-left: 4px solid #FF6B35;">
              <span style="font-size: 11px; color: #FF6B35; font-weight: 700; text-transform: uppercase;">Blank ${idx + 1}</span><br>
              <span style="font-size: 12px; color: #5C3422; line-height: 1.4;">${blank.hint}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-top: 16px; padding: 12px; background: #FAFAF8; border-radius: 8px; border-left: 4px solid #FF6B35; font-size: 12px; color: #5C3422;">
        <strong>💡 Tip:</strong> Hover over any blank field to see its hint, or refer to the hints section below.
      </div>
    </div>
  `;
}

// CSS for fill-in-the-blank inputs (add this inline style or to CSS file)
const fillBlankCSS = `
  .fill-blank-input {
    background: #FFFBF7;
    border: 2px solid #FDC830;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    color: #5C3422;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    min-width: 80px;
    transition: all 0.2s ease;
    margin: 0 2px;
  }
  
  .fill-blank-input:focus {
    outline: none;
    border-color: #FF6B35;
    box-shadow: 0 0 8px rgba(255, 107, 53, 0.2);
    background: white;
  }
`;

// Add CSS to document if not already present
if (!document.getElementById('fill-blank-styles')) {
  const style = document.createElement('style');
  style.id = 'fill-blank-styles';
  style.textContent = fillBlankCSS;
  document.head.appendChild(style);
}

// Select option in multiple choice
function selectOption(element) {
  const questionId = element.dataset.question;
  const question = document.getElementById(`question-${questionId}`);
  
  question.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
  question.classList.add('answered');
}

// Close task modal
function closeTaskModal() {
  const modal = document.getElementById('taskModal');
  modal.classList.remove('active');
}

// Submit task
function submitTask() {
  if (!currentTask || taskAnswered) return;

  let isCorrect = false;
  let score = 0;
  let message = '';
  let resultTitle = '';
  let resultIcon = '';

  if (currentTask.type === 'narrative') {
    const blankInputs = document.querySelectorAll('.fill-blank-input');
    const filledAnswers = {};
    let allFilled = true;
    
    blankInputs.forEach((input, idx) => {
      const value = input.value.trim();
      filledAnswers[idx] = value;
      if (!value) allFilled = false;
    });
    
    if (!allFilled) {
      showToast('❌ Please fill in all blanks before submitting.', 'error');
      return;
    }
    
    const blanks = currentTask.content.blanks;
    let correctCount = 0;
    
    Object.entries(filledAnswers).forEach(([idx, userAnswer]) => {
      const correctAnswer = blanks[idx].answer;
      const userLower = userAnswer.toLowerCase().trim();
      const correctLower = correctAnswer.toLowerCase().trim();
      
      if (userLower === correctLower || correctLower.includes(userLower) || userLower.includes(correctLower)) {
        correctCount++;
      }
    });
    
    score = Math.round((correctCount / blanks.length) * 100);
    isCorrect = score >= 80;
    resultTitle = isCorrect ? '🎉 Great Job!' : '📚 Keep Learning';
    resultIcon = isCorrect ? '✓' : '→';
    message = isCorrect 
      ? `You got ${correctCount} out of ${blanks.length} correct! Your score: ${score}%`
      : `You got ${correctCount} out of ${blanks.length} correct. Review the content and try again. Your score: ${score}%`;
    
  } else if (currentTask.type === 'multiple-choice') {
    const selected = document.querySelectorAll('.option.selected');
    if (selected.length !== currentTask.content.questions.length) {
      showToast('❌ Please answer all questions before submitting.', 'error');
      return;
    }
    
    let correctCount = 0;
    selected.forEach(opt => {
      if (opt.dataset.correct === 'true') {
        opt.classList.add('correct');
        correctCount++;
      } else {
        opt.classList.add('incorrect');
      }
    });
    
    score = Math.round((correctCount / currentTask.content.questions.length) * 100);
    isCorrect = score >= 80;
    resultTitle = isCorrect ? '🎉 Excellent!' : '📚 Good Effort';
    resultIcon = isCorrect ? '✓' : '→';
    message = isCorrect
      ? `You answered ${correctCount} out of ${currentTask.content.questions.length} correctly! Score: ${score}%`
      : `You answered ${correctCount} out of ${currentTask.content.questions.length} correctly. Score: ${score}%. Review and try again!`;
    
  } else if (currentTask.type === 'timeline') {
    const timelineItems = document.querySelectorAll('.timeline-item.draggable');
    const userOrder = Array.from(timelineItems).map(item => parseInt(item.dataset.index));
    
    const correctOrder = Array.from({length: currentTask.content.timeline.length}, (_, i) => i).sort((a, b) => {
      const dateA = new Date(currentTask.content.timeline[a].date);
      const dateB = new Date(currentTask.content.timeline[b].date);
      return dateA - dateB;
    });
    
    isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
    score = isCorrect ? 100 : 0;
    resultTitle = isCorrect ? '🎉 Perfect!' : '📅 Order Mismatch';
    resultIcon = isCorrect ? '✓' : '→';
    message = isCorrect
      ? 'You arranged the events in the perfect chronological order!'
      : 'The timeline order is not quite right. Try arranging the events again in chronological order.';
  }

  taskScore = score;
  taskAnswered = true;
  
  if (isCorrect) {
    answers[currentTask.id] = 'completed';
  }
  
  saveAnswers();
  updateProgress();
  
  // Show results
  showTaskResults(resultTitle, resultIcon, message, score, isCorrect);
}

// Show task results
function showTaskResults(title, icon, message, score, isCorrect) {
  const modalBody = document.getElementById('modalBody');
  const taskResults = document.getElementById('taskResults');
  const actionsContainer = document.getElementById('actionsContainer');
  const resultsIcon = document.getElementById('resultsIcon');
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsMessage = document.getElementById('resultsMessage');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const scoreValue = document.getElementById('scoreValue');
  const submitBtn = document.getElementById('submitBtn');
  
  // Hide modal body and show results
  modalBody.style.display = 'none';
  taskResults.style.display = 'block';
  
  // Update results content
  resultsIcon.textContent = icon;
  resultsTitle.textContent = title;
  resultsMessage.textContent = message;
  scoreValue.textContent = score + '%';
  scoreDisplay.style.display = 'block';
  
  // Update button text
  if (isCorrect) {
    submitBtn.textContent = '✓ Task Completed';
    submitBtn.style.background = '#4CAF50';
    submitBtn.onclick = () => {
      closeTaskModal();
      renderTasksByTopic();
    };
  } else {
    submitBtn.textContent = 'Try Again';
    submitBtn.style.background = '#FF6B35';
    submitBtn.onclick = () => {
      closeTaskModal();
      openTaskModal(currentTask.id);
    };
  }
  
  showToast(`📊 Score: ${score}%`, isCorrect ? 'success' : 'warning');
}

// Update word count
document.addEventListener('input', (e) => {
  if (e.target.id === 'narrativeInput') {
    const wordCount = e.target.value.trim().split(/\s+/).filter(w => w).length;
    const counter = document.getElementById('wordCount');
    if (counter) counter.textContent = wordCount;
  }
});

// Save answers to localStorage
function saveAnswers() {
  localStorage.setItem('taskAnswers', JSON.stringify(answers));
}

// Load answers from localStorage
function loadAnswers() {
  const saved = localStorage.getItem('taskAnswers');
  if (saved) {
    answers = JSON.parse(saved);
  }
}

// Update progress
function updateProgress() {
  const completed = Object.keys(answers).length;
  const total = tasksData.length;

  document.getElementById('progressText').textContent = `${completed} / ${total}`;
  const percentage = (completed / total) * 100;
  document.getElementById('progressFill').style.width = `${percentage}%`;
}

// Close all accordions
function closeAllAccordions() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.classList.remove('active');
    const content = header.nextElementSibling;
    if (content && content.classList.contains('accordion-content')) {
      content.classList.remove('active');
    }
  });
}

// Expose functions to global scope for inline onclick handlers
window.toggleAccordion = toggleAccordion;
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.submitTask = submitTask;
window.selectOption = selectOption;

// Drag and drop handlers for timeline
let draggedElement = null;

window.handleTimelineDragStart = function(event) {
  draggedElement = event.currentTarget;
  draggedElement.style.opacity = '0.5';
  event.dataTransfer.effectAllowed = 'move';
};

window.handleTimelineDragEnd = function(event) {
  draggedElement.style.opacity = '1';
  draggedElement = null;
};

window.handleTimelineDragOver = function(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const afterElement = getDragAfterElement(document.getElementById('timelineContainer'), event.clientY);
  const container = document.getElementById('timelineContainer');
  if (afterElement == null) {
    container.appendChild(draggedElement);
  } else {
    container.insertBefore(draggedElement, afterElement);
  }
};

window.handleTimelineDrop = function(event) {
  event.preventDefault();
};

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.timeline-item.draggable')].filter(el => el !== draggedElement);
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
