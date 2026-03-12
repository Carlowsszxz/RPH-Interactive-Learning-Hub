/**
 * Common utility functions for the URS application
 */

/**
 * Format a date string for display
 * @param {string|Date} dateStr - Date string or Date object
 * @param {string} format - Format style: 'short', 'long', 'full', 'time'
 * @returns {string} Formatted date
 */
export function formatDate(dateStr, format = 'short') {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'long':
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    case 'full':
      return date.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    case 'time':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    default:
      return date.toLocaleDateString('en-US');
  }
}

/**
 * Get relative time from now (e.g., "2 hours ago", "in 3 days")
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Relative time string
 */
export function getRelativeTime(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const now = new Date();
  const diff = now - date;
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return diff > 0 ? 'just now' : 'in a moment';
  if (minutes < 60) return diff > 0 ? `${minutes}m ago` : `in ${minutes}m`;
  if (hours < 24) return diff > 0 ? `${hours}h ago` : `in ${hours}h`;
  if (days < 7) return diff > 0 ? `${days}d ago` : `in ${days}d`;
  if (weeks < 4) return diff > 0 ? `${weeks}w ago` : `in ${weeks}w`;
  if (months < 12) return diff > 0 ? `${months}mo ago` : `in ${months}mo`;

  const years = Math.floor(months / 12);
  return diff > 0 ? `${years}y ago` : `in ${years}y`;
}

/**
 * Check if a date is overdue
 * @param {string|Date} dueDate - Due date
 * @returns {boolean} True if overdue
 */
export function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

/**
 * Check if a date is due today
 * @param {string|Date} dueDate - Due date
 * @returns {boolean} True if due today
 */
export function isDueToday(dueDate) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const today = new Date();
  return due.toDateString() === today.toDateString();
}

/**
 * Get days until due date
 * @param {string|Date} dueDate - Due date
 * @returns {number} Days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  const diff = due - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHTML(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Truncate text to maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to append (default: '...')
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter of string
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert activity type to display label with icon
 * @param {string} activityType - Activity type (assignment/quiz/reflection/discussion)
 * @returns {Object} Object with icon and label
 */
export function getActivityTypeInfo(activityType) {
  const typeMap = {
    'assignment': { icon: '📝', label: 'Assignment', color: 'bg-blue-50' },
    'quiz': { icon: '📋', label: 'Quiz', color: 'bg-purple-50' },
    'reflection': { icon: '💭', label: 'Reflection', color: 'bg-green-50' },
    'discussion': { icon: '💬', label: 'Discussion', color: 'bg-orange-50' }
  };
  return typeMap[activityType] || { icon: '📄', label: 'Activity', color: 'bg-gray-50' };
}

/**
 * Convert status to display label with color
 * @param {string} status - Status (draft/submitted/graded/late)
 * @returns {Object} Object with color class and label
 */
export function getStatusInfo(status) {
  const statusMap = {
    'draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
    'submitted': { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
    'graded': { color: 'bg-green-100 text-green-800', label: 'Graded' },
    'late': { color: 'bg-red-100 text-red-800', label: 'Late' }
  };
  return statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
}

/**
 * Convert grade letter to numeric score range
 * @param {string} grade - Grade letter (A/B/C/D/F)
 * @returns {number} Numeric score (4.0 scale)
 */
export function gradeToScore(grade) {
  const gradeMap = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };
  return gradeMap[grade] || 0;
}

/**
 * Calculate percentage from score
 * @param {number} score - Numeric score
 * @param {number} maxScore - Maximum possible score
 * @returns {number} Percentage (0-100)
 */
export function calculatePercentage(score, maxScore) {
  if (!maxScore || maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100);
}

/**
 * Format points display (e.g., "5 pts", "10 points")
 * @param {number} points - Number of points
 * @param {boolean} abbreviated - Use abbreviation (default: true)
 * @returns {string} Formatted points string
 */
export function formatPoints(points, abbreviated = true) {
  if (!points) return abbreviated ? '0 pts' : '0 points';
  return abbreviated ? `${points} pts` : `${points} point${points === 1 ? '' : 's'}`;
}

/**
 * Check if email is valid format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if URL is valid
 * @param {string} urlString - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidURL(urlString) {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Generate random color (hex)
 * @returns {string} Random hex color
 */
export function getRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Parse query parameters from URL
 * @param {string} queryString - Query string (default: current URL)
 * @returns {Object} Parsed parameters
 */
export function parseQueryParams(queryString = location.search) {
  const params = new URLSearchParams(queryString);
  const result = {};
  for (let [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * Build query string from object
 * @param {Object} params - Parameters object
 * @returns {string} Query string
 */
export function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
}

/**
 * Show toast notification (requires toast container in DOM)
 * @param {string} message - Toast message
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  const colorMap = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  toast.className = `${colorMap[type] || colorMap.info} text-white px-4 py-3 rounded-lg shadow-lg mb-2`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}

/**
 * Create toast container if it doesn't exist
 * @returns {HTMLElement} Toast container
 */
function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed top-4 right-4 z-50 flex flex-col';
  document.body.appendChild(container);
  return container;
}

export default {
  formatDate,
  getRelativeTime,
  isOverdue,
  isDueToday,
  getDaysUntilDue,
  escapeHTML,
  truncateText,
  capitalize,
  getActivityTypeInfo,
  getStatusInfo,
  gradeToScore,
  calculatePercentage,
  formatPoints,
  isValidEmail,
  isValidURL,
  getRandomColor,
  debounce,
  parseQueryParams,
  buildQueryString,
  showToast
};
