// =============================================================================
// PetalList 🎀 - Frontend Client Script
// Handles UI interactions, API requests, localStorage persistence & Daily Surprise
// =============================================================================

// -----------------------------------------------------------------------------
// Global State & Configuration
// -----------------------------------------------------------------------------
const API_URL = '/api/tasks';
const LOCAL_STORAGE_KEY = 'petallist_tasks_cache';
const SESSION_STORAGE_QUOTE_KEY = 'petallist_last_quote_id';

let tasks = [];
let currentFilter = 'all'; // 'all' | 'active' | 'completed'

// -----------------------------------------------------------------------------
// DOM Elements
// -----------------------------------------------------------------------------
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const validationMsg = document.getElementById('validationMsg');
const inputContainer = document.querySelector('.input-container');

const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');

const activeTasksCountEl = document.getElementById('activeTasksCount');
const completedTasksCountEl = document.getElementById('completedTasksCount');
const progressPercentageEl = document.getElementById('progressPercentage');
const progressBarFill = document.getElementById('progressBarFill');
const progressBarContainer = document.getElementById('progressBarContainer');
const progressCaption = document.getElementById('progressCaption');

const filterTabs = document.querySelectorAll('.filter-tab');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

const quoteCategoryEl = document.getElementById('quoteCategory');
const quoteTextEl = document.getElementById('quoteText');
const shuffleQuoteBtn = document.getElementById('shuffleQuoteBtn');

const syncStatusDot = document.querySelector('.sync-dot');
const syncStatusText = document.getElementById('syncStatusText');
const toastContainer = document.getElementById('toastContainer');

// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Daily Surprise Quote
  initDailyReminder();

  // 2. Setup Event Listeners
  setupEventListeners();

  // 3. Load Tasks (Syncing with Server & LocalStorage)
  loadInitialTasks();
});

// -----------------------------------------------------------------------------
// 1. Daily Surprise — Quotes, Jokes & Girly Motivation 🎀💌
// -----------------------------------------------------------------------------
function initDailyReminder() {
  if (typeof PETAL_QUOTES === 'undefined' || !Array.isArray(PETAL_QUOTES) || PETAL_QUOTES.length === 0) {
    quoteCategoryEl.textContent = 'GIRL, YOU GOT THIS 💗';
    quoteTextEl.textContent = 'You are the main character. Go make today unforgettable ♡';
    return;
  }

  // Display a random quote (avoiding consecutive repeat via sessionStorage)
  displayRandomQuote(true);
}

/**
 * Selects and displays a random quote.
 * @param {boolean} checkSession - If true, avoids the last shown quote ID from sessionStorage
 */
function displayRandomQuote(checkSession = false) {
  if (!PETAL_QUOTES || PETAL_QUOTES.length === 0) return;

  const lastId = sessionStorage.getItem(SESSION_STORAGE_QUOTE_KEY);
  let availableQuotes = PETAL_QUOTES;

  // Filter out the quote shown on the immediately preceding reload/click if possible
  if (checkSession && lastId && PETAL_QUOTES.length > 1) {
    availableQuotes = PETAL_QUOTES.filter(q => String(q.id) !== String(lastId));
  }

  // Pick a random quote
  const randomIndex = Math.floor(Math.random() * availableQuotes.length);
  const chosenQuote = availableQuotes[randomIndex];

  // Store in sessionStorage so next reload won't show the exact same quote
  sessionStorage.setItem(SESSION_STORAGE_QUOTE_KEY, chosenQuote.id);

  // Soft fade transition
  quoteTextEl.classList.remove('fade-in');
  quoteTextEl.classList.add('fade-out');

  setTimeout(() => {
    quoteCategoryEl.textContent = chosenQuote.category;
    quoteTextEl.textContent = chosenQuote.text;

    quoteTextEl.classList.remove('fade-out');
    quoteTextEl.classList.add('fade-in');
  }, 180);
}

// -----------------------------------------------------------------------------
// 2. Task Synchronization (Backend Express API + Browser LocalStorage)
// -----------------------------------------------------------------------------

/**
 * Loads tasks on initial page visit.
 * Strategy:
 * 1. Checks localStorage for existing saved tasks.
 * 2. Fetches tasks from GET /api/tasks.
 * 3. If server is running and has tasks, use them and cache to localStorage.
 * 4. If server restarted and has empty/default state but localStorage has custom tasks,
 *    we sync localStorage tasks up to the server via POST /api/tasks/sync!
 * 5. If server is offline, fallback smoothly to localStorage.
 */
async function loadInitialTasks() {
  const localCache = getTasksFromLocalStorage();

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const serverTasks = await response.json();
    setSyncStatus(true, 'Synced with server & browser 🌸');

    // If client had custom tasks in localStorage and server has fewer or default,
    // sync client tasks to server to preserve user data across server restarts
    if (localCache && localCache.length > 0 && Array.isArray(serverTasks)) {
      // Check if server is missing the cached tasks
      const serverIds = new Set(serverTasks.map(t => t.id));
      const hasMissingLocal = localCache.some(t => !serverIds.has(t.id));

      if (hasMissingLocal) {
        // Restore cached tasks onto the server
        const syncResponse = await fetch(`${API_URL}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientTasks: localCache })
        });

        if (syncResponse.ok) {
          tasks = await syncResponse.json();
          saveTasksToLocalStorage(tasks);
          renderTasks();
          return;
        }
      }
    }

    // Default to server tasks
    tasks = Array.isArray(serverTasks) ? serverTasks : [];
    saveTasksToLocalStorage(tasks);
    renderTasks();

  } catch (error) {
    console.warn('Backend API unavailable or offline, loading from localStorage:', error);
    setSyncStatus(false, 'Offline mode (saved in browser) ♡');

    // Fallback to localStorage
    if (localCache && localCache.length > 0) {
      tasks = localCache;
    } else {
      // Default initial starter tasks if fresh browser
      tasks = [
        { id: 1, text: "Romanticize your morning coffee ☕🌸", completed: true, createdAt: new Date().toISOString() },
        { id: 2, text: "Finish that assignment before the panic sets in ♡", completed: false, createdAt: new Date().toISOString() },
        { id: 3, text: "Drink some ice water and hydrate, pretty girl ✨", completed: false, createdAt: new Date().toISOString() }
      ];
      saveTasksToLocalStorage(tasks);
    }
    renderTasks();
  }
}

/**
 * Reads tasks from localStorage.
 */
function getTasksFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return null;
  }
}

/**
 * Saves tasks to localStorage.
 */
function saveTasksToLocalStorage(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing to localStorage:', e);
  }
}

/**
 * Updates the footer sync badge indicator.
 */
function setSyncStatus(isOnline, message) {
  if (syncStatusDot && syncStatusText) {
    if (isOnline) {
      syncStatusDot.classList.remove('offline');
      syncStatusText.textContent = message;
    } else {
      syncStatusDot.classList.add('offline');
      syncStatusText.textContent = message;
    }
  }
}

// -----------------------------------------------------------------------------
// 3. Event Listeners Setup
// -----------------------------------------------------------------------------
function setupEventListeners() {
  // Form submission (Add Task)
  taskForm.addEventListener('submit', handleAddTask);

  // Clear validation error on typing
  taskInput.addEventListener('input', () => {
    clearValidationError();
  });

  // Filter tabs click
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentFilter = tab.getAttribute('data-filter') || 'all';
      renderTasks();
    });
  });

  // Clear completed tasks button
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', handleClearCompleted);
  }

  // Daily surprise shuffle button
  if (shuffleQuoteBtn) {
    shuffleQuoteBtn.addEventListener('click', () => {
      displayRandomQuote(true);
    });
  }
}

// -----------------------------------------------------------------------------
// 4. Task CRUD Operations
// -----------------------------------------------------------------------------

/**
 * Add a new task
 */
async function handleAddTask(e) {
  e.preventDefault();

  const taskText = taskInput.value.trim();

  // Client-side validation: Reject empty or whitespace-only tasks
  if (!taskText) {
    showValidationError("Please write a cute little task first, pretty girl! ♡");
    return;
  }

  // Clear input immediately for snappy UX
  taskInput.value = '';
  clearValidationError();

  try {
    // 1. Call POST /api/tasks
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: taskText })
    });

    if (response.ok) {
      const createdTask = await response.json();
      tasks.push(createdTask);
      showToast("Added to your lovely list! 🌸");
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server rejected task');
    }
  } catch (error) {
    console.warn('Creating task locally due to API issue:', error);
    // Offline local fallback
    const localNewTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString()
    };
    tasks.push(localNewTask);
    showToast("Added to your list (saved locally)! 🌸");
  }

  // Update localStorage and refresh UI
  saveTasksToLocalStorage(tasks);
  renderTasks();
  taskInput.focus();
}

/**
 * Toggle task completion status
 */
async function handleToggleTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const targetStatus = !task.completed;
  task.completed = targetStatus;

  // Render immediately for instant feedback
  renderTasks();
  saveTasksToLocalStorage(tasks);

  if (targetStatus) {
    showToast("Task completed! You're glowing ♡ ✨");
  }

  // Synchronize with backend API
  try {
    await fetch(`${API_URL}/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: targetStatus })
    });
  } catch (error) {
    console.warn(`Could not sync PATCH /api/tasks/${taskId}:`, error);
  }
}

/**
 * Delete a task
 */
async function handleDeleteTask(taskId) {
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return;

  // Remove from state
  tasks.splice(taskIndex, 1);
  saveTasksToLocalStorage(tasks);
  renderTasks();
  showToast("Task swept away! 🎀");

  // Synchronize with backend API
  try {
    await fetch(`${API_URL}/${taskId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.warn(`Could not sync DELETE /api/tasks/${taskId}:`, error);
  }
}

/**
 * Clear all completed tasks
 */
async function handleClearCompleted() {
  const completedTasks = tasks.filter(t => t.completed);
  if (completedTasks.length === 0) {
    showToast("No finished tasks to clear yet ♡");
    return;
  }

  // Keep only active tasks
  tasks = tasks.filter(t => !t.completed);
  saveTasksToLocalStorage(tasks);
  renderTasks();
  showToast("Cleaned up finished tasks! 🧹✨");

  // Sync deletes with backend
  for (const t of completedTasks) {
    try {
      await fetch(`${API_URL}/${t.id}`, { method: 'DELETE' });
    } catch (e) {
      // Ignore background sync errors
    }
  }
}

// -----------------------------------------------------------------------------
// 5. Rendering & Statistics
// -----------------------------------------------------------------------------

/**
 * Renders the task list and updates statistics immediately.
 */
function renderTasks() {
  taskList.innerHTML = '';

  // Filter tasks based on selected tab
  let filteredTasks = tasks;
  if (currentFilter === 'active') {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(t => t.completed);
  }

  // Toggle Empty State display
  if (filteredTasks.length === 0) {
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';

    // Populate filtered items
    filteredTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.setAttribute('data-id', task.id);

      // Checkbox container
      const leftDiv = document.createElement('div');
      leftDiv.className = 'task-left';

      // Completion Checkbox button
      const checkBtn = document.createElement('button');
      checkBtn.type = 'button';
      checkBtn.className = 'task-checkbox-btn';
      checkBtn.setAttribute('aria-label', task.completed ? 'Mark task as active' : 'Mark task as completed');
      checkBtn.innerHTML = task.completed ? '✓' : '';
      checkBtn.addEventListener('click', () => handleToggleTask(task.id));

      // Task Description text
      const textSpan = document.createElement('span');
      textSpan.className = 'task-text';
      textSpan.textContent = task.text;

      leftDiv.appendChild(checkBtn);
      leftDiv.appendChild(textSpan);

      // Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'task-delete-btn';
      deleteBtn.setAttribute('title', 'Delete task');
      deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
      deleteBtn.innerHTML = '×';
      deleteBtn.addEventListener('click', () => handleDeleteTask(task.id));

      li.appendChild(leftDiv);
      li.appendChild(deleteBtn);
      taskList.appendChild(li);
    });
  }

  // Update statistics immediately
  updateStatistics();
}

/**
 * Updates active count, completed count, and progress bar.
 */
function updateStatistics() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;

  activeTasksCountEl.textContent = active;
  completedTasksCountEl.textContent = completed;

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressPercentageEl.textContent = `${percentage}%`;
  progressBarFill.style.width = `${percentage}%`;
  progressBarContainer.setAttribute('aria-valuenow', percentage);

  // Dynamic cute progress caption
  if (total === 0) {
    progressCaption.textContent = "Time to romanticize your day ♡";
  } else if (percentage === 0) {
    progressCaption.textContent = "Ready to blossom, beautiful? 🌸";
  } else if (percentage < 50) {
    progressCaption.textContent = "Lovely start, keep blooming! ✨";
  } else if (percentage < 100) {
    progressCaption.textContent = "More than halfway there, gorgeous! 💗";
  } else {
    progressCaption.textContent = "All finished! You're iconic! 🎀🎉";
  }
}

// -----------------------------------------------------------------------------
// 6. UI Helpers (Validation & Toasts)
// -----------------------------------------------------------------------------

function showValidationError(message) {
  validationMsg.textContent = message;
  validationMsg.classList.add('visible');
  inputContainer.classList.add('error-shake');

  setTimeout(() => {
    inputContainer.classList.remove('error-shake');
  }, 500);
}

function clearValidationError() {
  validationMsg.textContent = '';
  validationMsg.classList.remove('visible');
  inputContainer.classList.remove('error-shake');
}

/**
 * Shows a sweet, temporary feedback toast.
 */
function showToast(message) {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2400);
}
