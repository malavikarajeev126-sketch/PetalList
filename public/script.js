// =============================================================================
// PetalList - task management and daily reminder
// =============================================================================

const TASKS_API = '/api/tasks';
const QUOTE_STORAGE_KEY = 'petallist_last_quote_id';
const TODAY = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

let tasks = [];
let habits = [];
let tasksLoadError = null;
let currentFilter = 'all';
let currentQuote = null;
let currentTimerMode = 'focus';
let timerRemainingSeconds = 25 * 60;
let timerDeadline = null;
let timerInterval = null;
let favoriteQuoteIds = [];
const taskUtils = window.PetalTaskUtils;

const PREFERENCE_KEYS = {
  theme: 'petallist_theme',
  mode: 'petallist_mode',
  name: 'petallist_display_name',
  favorites: 'petallist_favorite_quotes'
};
const VALID_THEMES = ['blush', 'lavender', 'peach', 'mint'];
const VALID_MODES = ['light', 'dark'];

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskCategory = document.getElementById('taskCategory');
const taskPriority = document.getElementById('taskPriority');
const taskDueDate = document.getElementById('taskDueDate');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const emptyStateMessage = document.getElementById('emptyStateMessage');
const validationMsg = document.getElementById('validationMsg');
const inputContainer = document.querySelector('.input-container');
const filterTabs = document.querySelectorAll('.filter-tab');
const taskSearchInput = document.getElementById('taskSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const taskSortSelect = document.getElementById('taskSortSelect');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const todayTasksCount = document.getElementById('todayTasksCount');
const activeTasksCount = document.getElementById('activeTasksCount');
const completedTasksCount = document.getElementById('completedTasksCount');
const progressPercentage = document.getElementById('progressPercentage');
const progressBarFill = document.getElementById('progressBarFill');
const progressBarContainer = document.getElementById('progressBarContainer');
const progressCaption = document.getElementById('progressCaption');
const allFinishedBanner = document.getElementById('allFinishedBanner');
const quoteCategory = document.getElementById('quoteCategory');
const quoteText = document.getElementById('quoteText');
const shuffleQuoteBtn = document.getElementById('shuffleQuoteBtn');
const syncStatusDot = document.querySelector('.sync-dot');
const syncStatusText = document.getElementById('syncStatusText');
const toastContainer = document.getElementById('toastContainer');

const editTaskModal = document.getElementById('editTaskModal');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskId = document.getElementById('editTaskId');
const editTaskText = document.getElementById('editTaskText');
const editTaskCategory = document.getElementById('editTaskCategory');
const editTaskPriority = document.getElementById('editTaskPriority');
const editTaskDueDate = document.getElementById('editTaskDueDate');

document.addEventListener('DOMContentLoaded', () => {
  setupTaskEvents();
  setupFeatureEvents();
  initPreferences();
  initDailyReminder();
  updateGreeting();
  loadTasks();
  loadHabits();
});

async function apiRequest(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error('The server could not be reached. Your change was not saved.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    if (response.ok) {
      throw new Error('The server returned an invalid response. Please refresh and try again.');
    }
  }

  if (!response.ok) {
    throw new Error(data && data.error ? data.error : `Request failed (${response.status}).`);
  }
  return data;
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

async function loadTasks() {
  setSyncStatus(false, 'Connecting to your task list…');
  try {
    const result = await apiRequest(TASKS_API);
    if (!Array.isArray(result)) throw new Error('The server returned an invalid task list.');
    tasks = result;
    tasksLoadError = null;
    setSyncStatus(true, 'Tasks saved on this server 🌸');
    renderTasks();
  } catch (error) {
    tasksLoadError = error.message;
    setSyncStatus(false, 'Could not load tasks');
    showToast(error.message);
    renderTasks();
  }
}

function setSyncStatus(connected, message) {
  if (!syncStatusDot || !syncStatusText) return;
  syncStatusDot.classList.toggle('offline', !connected);
  syncStatusText.textContent = message;
}

function setupTaskEvents() {
  taskForm.addEventListener('submit', handleAddTask);
  taskInput.addEventListener('input', clearValidationError);
  filterTabs.forEach(tab => tab.addEventListener('click', () => {
    filterTabs.forEach(item => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    currentFilter = tab.dataset.filter || 'all';
    renderTasks();
  }));
  taskSearchInput.addEventListener('input', () => {
    clearSearchBtn.style.display = taskSearchInput.value ? 'inline-flex' : 'none';
    renderTasks();
  });
  clearSearchBtn.addEventListener('click', () => {
    taskSearchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderTasks();
    taskSearchInput.focus();
  });
  taskSortSelect.addEventListener('change', renderTasks);
  clearCompletedBtn.addEventListener('click', handleClearCompleted);
  editTaskForm.addEventListener('submit', handleEditTask);
  editTaskText.addEventListener('input', () => editTaskText.setCustomValidity(''));
  document.getElementById('closeEditModalBtn').addEventListener('click', closeEditTaskModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditTaskModal);
  editTaskModal.addEventListener('click', event => {
    if (event.target === editTaskModal) closeEditTaskModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeEditTaskModal();
  });
  shuffleQuoteBtn.addEventListener('click', () => displayRandomQuote(true));
}

function setupFeatureEvents() {
  document.querySelectorAll('.feature-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.feature-tab').forEach(item => {
        item.classList.toggle('active', item === tab);
        item.setAttribute('aria-selected', item === tab ? 'true' : 'false');
      });
      document.querySelectorAll('.view-panel').forEach(panel => {
        const visible = panel.id === tab.dataset.target;
        panel.style.display = visible ? 'block' : 'none';
        panel.classList.toggle('active', visible);
      });
    });
  });

  document.getElementById('habitForm').addEventListener('submit', handleAddHabit);
  document.getElementById('timerModeFocus').addEventListener('click', () => setTimerMode('focus'));
  document.getElementById('timerModeBreak').addEventListener('click', () => setTimerMode('break'));
  document.getElementById('timerStartBtn').addEventListener('click', startTimer);
  document.getElementById('timerPauseBtn').addEventListener('click', pauseTimer);
  document.getElementById('timerResetBtn').addEventListener('click', resetTimer);
  document.getElementById('timerTaskSelect').addEventListener('change', () => {
    if (timerInterval) updateTimerSessionLabel();
  });
  document.getElementById('themeSelect').addEventListener('change', event => setTheme(event.target.value, true));
  document.getElementById('modeToggleBtn').addEventListener('click', toggleMode);
  document.getElementById('editNameBtn').addEventListener('click', openNameModal);
  document.getElementById('editNameForm').addEventListener('submit', saveDisplayName);
  document.getElementById('closeNameModalBtn').addEventListener('click', closeNameModal);
  document.getElementById('cancelNameBtn').addEventListener('click', closeNameModal);
  document.getElementById('editNameModal').addEventListener('click', event => {
    if (event.target.id === 'editNameModal') closeNameModal();
  });
  document.getElementById('favoriteQuoteBtn').addEventListener('click', toggleFavoriteQuote);
  document.getElementById('openFavoritesBtn').addEventListener('click', openFavoritesModal);
  document.getElementById('closeFavModalBtn').addEventListener('click', closeFavoritesModal);
  document.getElementById('favoritesModal').addEventListener('click', event => {
    if (event.target.id === 'favoritesModal') closeFavoritesModal();
  });
}

function initPreferences() {
  const theme = readPreference(PREFERENCE_KEYS.theme, 'blush');
  const mode = readPreference(PREFERENCE_KEYS.mode, 'light');
  const displayName = readPreference(PREFERENCE_KEYS.name, 'Pretty Girl');
  const storedFavorites = readPreference(PREFERENCE_KEYS.favorites, '[]');
  setTheme(VALID_THEMES.includes(theme) ? theme : 'blush', false);
  setMode(VALID_MODES.includes(mode) ? mode : 'light', false);
  document.getElementById('userDisplayName').textContent = displayName;

  try {
    const parsed = JSON.parse(storedFavorites);
    const quoteIds = new Set((typeof PETAL_QUOTES === 'undefined' ? [] : PETAL_QUOTES).map(quote => String(quote.id)));
    favoriteQuoteIds = Array.isArray(parsed) ? parsed.map(String).filter(id => quoteIds.has(id)) : [];
  } catch (error) {
    console.error('Could not read saved quote favorites:', error);
    favoriteQuoteIds = [];
  }
  updateFavoriteControls();
}

function readPreference(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) {
    console.error(`Could not read preference "${key}":`, error);
    showToast('Browser storage is unavailable; preferences may not persist.');
    return fallback;
  }
}

function writePreference(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Could not save preference "${key}":`, error);
    showToast('Your browser could not save this preference.');
    return false;
  }
}

function setTheme(theme, persist) {
  if (!VALID_THEMES.includes(theme)) return;
  document.documentElement.dataset.theme = theme;
  document.getElementById('themeSelect').value = theme;
  if (persist) writePreference(PREFERENCE_KEYS.theme, theme);
}

function setMode(mode, persist) {
  if (!VALID_MODES.includes(mode)) return;
  document.documentElement.dataset.mode = mode;
  const dark = mode === 'dark';
  const button = document.getElementById('modeToggleBtn');
  document.getElementById('modeIcon').textContent = dark ? '☀️' : '🌙';
  button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  button.title = dark ? 'Switch to Light Mode' : 'Toggle Light / Coquette Midnight Mode';
  if (persist) writePreference(PREFERENCE_KEYS.mode, mode);
}

function toggleMode() {
  setMode(document.documentElement.dataset.mode === 'dark' ? 'light' : 'dark', true);
}

function openNameModal() {
  const modal = document.getElementById('editNameModal');
  const input = document.getElementById('nameInput');
  input.value = document.getElementById('userDisplayName').textContent;
  modal.style.display = 'flex';
  input.focus();
}

function closeNameModal() {
  document.getElementById('editNameModal').style.display = 'none';
}

function saveDisplayName(event) {
  event.preventDefault();
  const input = document.getElementById('nameInput');
  const name = input.value.trim();
  if (!name || name.length > 30) {
    input.setCustomValidity('Please enter a name between 1 and 30 characters.');
    input.reportValidity();
    return;
  }
  input.setCustomValidity('');
  document.getElementById('userDisplayName').textContent = name;
  writePreference(PREFERENCE_KEYS.name, name);
  closeNameModal();
}

function toggleFavoriteQuote() {
  if (!currentQuote) return;
  const id = String(currentQuote.id);
  favoriteQuoteIds = favoriteQuoteIds.includes(id)
    ? favoriteQuoteIds.filter(savedId => savedId !== id)
    : favoriteQuoteIds.concat(id);
  if (writePreference(PREFERENCE_KEYS.favorites, JSON.stringify(favoriteQuoteIds))) {
    updateFavoriteControls();
    if (document.getElementById('favoritesModal').style.display === 'flex') renderFavoriteQuotes();
  }
}

function updateFavoriteControls() {
  const isFavorite = currentQuote && favoriteQuoteIds.includes(String(currentQuote.id));
  document.getElementById('quoteHeartIcon').textContent = isFavorite ? '♥' : '♡';
  document.getElementById('favoriteQuoteBtn').setAttribute(
    'aria-label',
    isFavorite ? 'Remove quote from favorites' : 'Save quote to favorites'
  );
  document.getElementById('favCountBadge').textContent = String(favoriteQuoteIds.length);
}

function openFavoritesModal() {
  renderFavoriteQuotes();
  document.getElementById('favoritesModal').style.display = 'flex';
}

function closeFavoritesModal() {
  document.getElementById('favoritesModal').style.display = 'none';
}

function renderFavoriteQuotes() {
  const container = document.getElementById('favoritesListContainer');
  container.replaceChildren();
  const quotes = typeof PETAL_QUOTES === 'undefined' ? [] : PETAL_QUOTES;
  const saved = favoriteQuoteIds
    .map(id => quotes.find(quote => String(quote.id) === id))
    .filter(Boolean);
  if (!saved.length) {
    const empty = document.createElement('p');
    empty.className = 'favorites-empty';
    empty.textContent = 'Your saved love notes will appear here ♡';
    container.appendChild(empty);
    return;
  }

  saved.forEach(quote => {
    const item = document.createElement('article');
    item.className = 'fav-quote-item';
    const content = document.createElement('div');
    const text = document.createElement('p');
    text.className = 'fav-quote-text';
    text.textContent = quote.text;
    const category = document.createElement('p');
    category.className = 'fav-quote-cat';
    category.textContent = quote.category;
    content.append(text, category);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'fav-remove-btn';
    remove.setAttribute('aria-label', 'Remove saved quote');
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      favoriteQuoteIds = favoriteQuoteIds.filter(id => id !== String(quote.id));
      if (writePreference(PREFERENCE_KEYS.favorites, JSON.stringify(favoriteQuoteIds))) {
        updateFavoriteControls();
        renderFavoriteQuotes();
      }
    });
    item.append(content, remove);
    container.appendChild(item);
  });
}

async function loadHabits() {
  const list = document.getElementById('habitsList');
  list.setAttribute('aria-busy', 'true');
  try {
    const result = await apiRequest('/api/habits');
    if (!Array.isArray(result)) throw new Error('The server returned an invalid habit list.');
    habits = result;
    renderHabits();
  } catch (error) {
    showToast(`Habits could not be loaded: ${error.message}`);
    list.replaceChildren();
    updateGardenStage();
  } finally {
    list.removeAttribute('aria-busy');
  }
}

async function handleAddHabit(event) {
  event.preventDefault();
  const input = document.getElementById('habitInput');
  const name = input.value.trim();
  if (!name || name.length > 60) {
    input.setCustomValidity(name ? 'Use 60 characters or fewer.' : 'Please enter a habit name.');
    input.reportValidity();
    return;
  }
  input.setCustomValidity('');
  try {
    const habit = await apiRequest('/api/habits', jsonOptions('POST', {
      name,
      icon: document.getElementById('habitIconSelect').value
    }));
    habits.push(habit);
    input.value = '';
    renderHabits();
    showToast('A new habit has been planted 🌱');
  } catch (error) {
    showToast(`Habit was not saved: ${error.message}`);
  }
}

async function toggleHabit(habitId) {
  if (!habits.some(habit => habit.id === habitId)) {
    showToast('That habit could not be found. Refreshing the garden.');
    loadHabits();
    return;
  }
  try {
    const habit = await apiRequest(`/api/habits/${encodeURIComponent(habitId)}/toggle`, jsonOptions('PATCH', {
      date: TODAY()
    }));
    replaceHabit(habit);
    renderHabits();
  } catch (error) {
    showToast(`Habit update was not saved: ${error.message}`);
  }
}

async function deleteHabit(habitId) {
  if (!habits.some(habit => habit.id === habitId)) return;
  try {
    await apiRequest(`/api/habits/${encodeURIComponent(habitId)}`, { method: 'DELETE' });
    habits = habits.filter(habit => habit.id !== habitId);
    renderHabits();
    showToast('Habit removed from your garden 🌷');
  } catch (error) {
    showToast(`Habit was not deleted: ${error.message}`);
  }
}

function replaceHabit(updated) {
  const index = habits.findIndex(habit => habit.id === updated.id);
  if (index !== -1) habits[index] = updated;
}

function renderHabits() {
  const list = document.getElementById('habitsList');
  list.replaceChildren();
  const today = TODAY();
  habits.forEach(habit => {
    const done = Array.isArray(habit.completedDates) && habit.completedDates.includes(today);
    const item = document.createElement('li');
    item.className = `habit-item${done ? ' done-today' : ''}`;
    const left = document.createElement('div');
    left.className = 'habit-left';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'habit-check-btn';
    toggle.setAttribute('aria-label', done ? `Unmark ${habit.name} for today` : `Mark ${habit.name} complete for today`);
    toggle.setAttribute('aria-pressed', String(done));
    toggle.textContent = done ? '✓' : '';
    toggle.addEventListener('click', () => toggleHabit(habit.id));
    const info = document.createElement('div');
    info.className = 'habit-info';
    const name = document.createElement('span');
    name.className = 'habit-name';
    name.textContent = `${habit.icon || '🌸'} ${habit.name}`;
    const streak = document.createElement('span');
    streak.className = 'habit-streak';
    streak.textContent = `${habitStreak(habit)} day streak`;
    info.append(name, streak);
    left.append(toggle, info);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'habit-delete-btn';
    remove.setAttribute('aria-label', `Delete habit: ${habit.name}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => deleteHabit(habit.id));
    item.append(left, remove);
    list.appendChild(item);
  });
  updateGardenStage();
}

function habitStreak(habit) {
  const dates = new Set(Array.isArray(habit.completedDates) ? habit.completedDates : []);
  const startDate = dates.has(TODAY()) ? TODAY() : dateOffset(-1);
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  let streak = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function dateOffset(offset) {
  const date = new Date(`${TODAY()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function updateGardenStage() {
  const completed = habits.filter(habit => Array.isArray(habit.completedDates) && habit.completedDates.includes(TODAY())).length;
  const total = habits.length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  document.getElementById('gardenProgressFill').style.width = `${percent}%`;
  document.getElementById('gardenProgressText').textContent = `${completed} / ${total} habits bloomed today`;
  const art = document.getElementById('gardenStageArt');
  const title = document.getElementById('gardenStageTitle');
  const description = document.getElementById('gardenStageDesc');
  if (!total) {
    art.textContent = '🌱';
    title.textContent = 'A Little Seedling';
    description.textContent = 'Plant a habit to start your virtual garden! 🌸';
  } else if (completed === total) {
    art.textContent = '💐';
    title.textContent = 'A Garden in Full Bloom';
    description.textContent = 'Every habit bloomed today. Look at you grow! ✨';
  } else if (completed > 0) {
    art.textContent = '🌷';
    title.textContent = 'Growing Beautifully';
    description.textContent = 'Each little step helps your garden blossom 🌸';
  } else {
    art.textContent = '🌱';
    title.textContent = 'Ready to Grow';
    description.textContent = 'Water your habits today to watch your garden blossom! 🌸';
  }
}

function setTimerMode(mode) {
  if (mode !== 'focus' && mode !== 'break') return;
  currentTimerMode = mode;
  document.getElementById('timerModeFocus').classList.toggle('active', mode === 'focus');
  document.getElementById('timerModeBreak').classList.toggle('active', mode === 'break');
  resetTimer();
}

function startTimer() {
  if (timerInterval) return;
  if (timerRemainingSeconds <= 0) resetTimer();
  timerDeadline = Date.now() + timerRemainingSeconds * 1000;
  document.getElementById('timerStartBtn').disabled = true;
  document.getElementById('timerPauseBtn').disabled = false;
  timerInterval = window.setInterval(tickTimer, 250);
  updateTimerSessionLabel();
  tickTimer();
}

function updateTimerSessionLabel() {
  const select = document.getElementById('timerTaskSelect');
  const badge = document.getElementById('pomodoroSessionType');
  if (select.value) {
    badge.textContent = `Focusing on: ${select.options[select.selectedIndex].textContent}`;
  } else {
    badge.textContent = currentTimerMode === 'focus' ? 'Focus Session 🎀' : 'Gentle Break ☕';
  }
}

function tickTimer() {
  timerRemainingSeconds = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
  updateTimerDisplay();
  if (timerRemainingSeconds === 0) {
    window.clearInterval(timerInterval);
    timerInterval = null;
    timerDeadline = null;
    document.getElementById('timerStartBtn').disabled = true;
    document.getElementById('timerPauseBtn').disabled = true;
    document.getElementById('pomodoroSessionType').textContent = 'Session complete ✨';
    updateTimerDisplay();
    showToast(currentTimerMode === 'focus' ? 'Focus session complete! Take a little break ♡' : 'Break complete. Ready when you are 🌸');
    playTimerChime();
  }
}

function pauseTimer() {
  if (timerDeadline) {
    timerRemainingSeconds = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
    updateTimerDisplay();
  }
  if (timerInterval) window.clearInterval(timerInterval);
  timerInterval = null;
  timerDeadline = null;
  document.getElementById('timerStartBtn').disabled = false;
  document.getElementById('timerPauseBtn').disabled = true;
  updateTimerDisplay();
}

function resetTimer() {
  if (timerInterval) window.clearInterval(timerInterval);
  timerInterval = null;
  timerDeadline = null;
  timerRemainingSeconds = currentTimerMode === 'focus' ? 25 * 60 : 5 * 60;
  document.getElementById('timerStartBtn').disabled = false;
  document.getElementById('timerPauseBtn').disabled = true;
  document.getElementById('pomodoroSessionType').textContent = currentTimerMode === 'focus' ? 'Focus Session 🎀' : 'Gentle Break ☕';
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerRemainingSeconds / 60);
  const seconds = timerRemainingSeconds % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  document.getElementById('timerDisplay').textContent = display;
  document.title = timerInterval ? `${display} · PetalList` : 'PetalList 🎀 — Smart Personal Productivity & Habit Garden ♡';
}

function playTimerChime() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.6);
    oscillator.addEventListener('ended', () => context.close());
  } catch (error) {
    console.warn('Could not play the focus timer chime:', error);
  }
}

async function handleAddTask(event) {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    showValidationError('Please write a task first ♡');
    return;
  }
  if (text.length > 200) {
    showValidationError('Task descriptions must be 200 characters or fewer.');
    return;
  }

  const newTask = {
    text,
    category: taskCategory.value,
    priority: taskPriority.value,
    dueDate: taskDueDate.value || null
  };

  try {
    const created = await apiRequest(TASKS_API, jsonOptions('POST', newTask));
    tasks.push(created);
    tasksLoadError = null;
    taskInput.value = '';
    taskDueDate.value = '';
    clearValidationError();
    setSyncStatus(true, 'Tasks saved on this server 🌸');
    renderTasks();
    taskInput.focus();
    showToast('Added to your lovely list! 🌸');
  } catch (error) {
    showValidationError(error.message);
    setSyncStatus(false, 'Task was not saved');
  }
}

async function handleToggleTask(taskId) {
  const task = tasks.find(item => item.id === taskId);
  if (!task) return;
  try {
    const updated = await apiRequest(`${TASKS_API}/${encodeURIComponent(taskId)}`, jsonOptions('PATCH', {
      completed: !task.completed
    }));
    replaceTask(updated);
    renderTasks();
    showToast(updated.completed ? 'Task completed! You’re glowing ♡ ✨' : 'Task moved back to your list.');
  } catch (error) {
    showToast(error.message);
    setSyncStatus(false, 'Task update was not saved');
  }
}

async function handleDeleteTask(taskId) {
  const task = tasks.find(item => item.id === taskId);
  if (!task) return;
  try {
    await apiRequest(`${TASKS_API}/${encodeURIComponent(taskId)}`, { method: 'DELETE' });
    tasks = tasks.filter(item => item.id !== taskId);
    renderTasks();
    showToast('Task swept away! 🎀');
  } catch (error) {
    showToast(error.message);
    setSyncStatus(false, 'Task was not deleted');
  }
}

async function handleClearCompleted() {
  const completed = tasks.filter(task => task.completed);
  if (!completed.length) {
    showToast('No finished tasks to clear yet ♡');
    return;
  }
  try {
    for (const task of completed) {
      await apiRequest(`${TASKS_API}/${encodeURIComponent(task.id)}`, { method: 'DELETE' });
      tasks = tasks.filter(item => item.id !== task.id);
    }
    renderTasks();
    showToast('Cleaned up finished tasks! 🧹✨');
  } catch (error) {
    await loadTasks();
    showToast(`Some tasks may remain: ${error.message}`);
  }
}

function openEditTaskModal(taskId) {
  const task = tasks.find(item => item.id === taskId);
  if (!task) {
    showToast('That task is no longer available. Refreshing your list.');
    loadTasks();
    return;
  }
  editTaskId.value = String(task.id);
  editTaskText.value = task.text;
  editTaskCategory.value = task.category || 'Personal';
  editTaskPriority.value = task.priority || 'Medium';
  editTaskDueDate.value = isValidDate(task.dueDate) ? task.dueDate : '';
  editTaskModal.style.display = 'flex';
  editTaskText.focus();
}

function closeEditTaskModal() {
  editTaskModal.style.display = 'none';
}

async function handleEditTask(event) {
  event.preventDefault();
  const id = Number(editTaskId.value);
  if (!Number.isSafeInteger(id) || id < 1 || !tasks.some(task => task.id === id)) {
    closeEditTaskModal();
    showToast('That task could not be found. Refreshing your list.');
    await loadTasks();
    return;
  }
  const text = editTaskText.value.trim();
  if (!text || text.length > 200) {
    editTaskText.setCustomValidity(text ? 'Use 200 characters or fewer.' : 'Task description cannot be empty.');
    editTaskText.reportValidity();
    return;
  }
  editTaskText.setCustomValidity('');

  try {
    const updated = await apiRequest(`${TASKS_API}/${encodeURIComponent(id)}`, jsonOptions('PATCH', {
      text,
      category: editTaskCategory.value,
      priority: editTaskPriority.value,
      dueDate: editTaskDueDate.value || null
    }));
    replaceTask(updated);
    closeEditTaskModal();
    renderTasks();
    showToast('Task details saved ♡');
  } catch (error) {
    showToast(error.message);
    setSyncStatus(false, 'Task changes were not saved');
  }
}

function replaceTask(updated) {
  const index = tasks.findIndex(task => task.id === updated.id);
  if (index !== -1) tasks[index] = updated;
}

function renderTasks() {
  const today = TODAY();
  const filteredTasks = taskUtils.filterTasks(tasks, currentFilter, taskSearchInput.value, today);
  const visibleTasks = taskUtils.sortTasks(filteredTasks, taskSortSelect.value);

  taskList.replaceChildren();
  visibleTasks.forEach(task => taskList.appendChild(createTaskElement(task, today)));
  emptyState.style.display = visibleTasks.length ? 'none' : 'flex';
  if (emptyStateMessage) {
    emptyStateMessage.textContent = !visibleTasks.length && tasksLoadError
      ? `Tasks could not be loaded: ${tasksLoadError}`
      : emptyMessage();
  }
  updateStatistics();
  updateFocusTaskOptions();
}

function createTaskElement(task, today) {
  const item = document.createElement('li');
  item.className = `task-item${task.completed ? ' completed' : ''}`;
  item.dataset.id = String(task.id);

  const left = document.createElement('div');
  left.className = 'task-left';
  const checkbox = document.createElement('button');
  checkbox.type = 'button';
  checkbox.className = 'task-checkbox-btn';
  checkbox.setAttribute('aria-label', task.completed ? 'Mark task as active' : 'Mark task as completed');
  checkbox.textContent = task.completed ? '✓' : '';
  checkbox.addEventListener('click', () => handleToggleTask(task.id));

  const content = document.createElement('div');
  content.className = 'task-content';
  const text = document.createElement('span');
  text.className = 'task-text';
  text.textContent = task.text;
  content.appendChild(text);

  const tags = document.createElement('div');
  tags.className = 'task-tags-row';
  appendTag(tags, task.category || 'Personal', 'tag-badge category-tag');
  const priority = ['High', 'Medium', 'Low'].includes(task.priority) ? task.priority : 'Medium';
  appendTag(tags, `${priority} priority`, `tag-badge priority-tag priority-${priority.toLowerCase()}`);
  if (isValidDate(task.dueDate)) {
    const dueTag = document.createElement('span');
    dueTag.className = `tag-badge due-date-tag${!task.completed && task.dueDate < today ? ' overdue' : ''}`;
    dueTag.textContent = `${task.dueDate < today && !task.completed ? 'Overdue · ' : 'Due · '}${formatDate(task.dueDate)}`;
    tags.appendChild(dueTag);
  }
  content.appendChild(tags);
  left.append(checkbox, content);

  const actions = document.createElement('div');
  actions.className = 'task-actions';
  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'task-edit-btn';
  edit.title = 'Edit task';
  edit.setAttribute('aria-label', `Edit task: ${task.text}`);
  edit.textContent = '✎';
  edit.addEventListener('click', () => openEditTaskModal(task.id));
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'task-delete-btn';
  remove.title = 'Delete task';
  remove.setAttribute('aria-label', `Delete task: ${task.text}`);
  remove.textContent = '×';
  remove.addEventListener('click', () => handleDeleteTask(task.id));
  actions.append(edit, remove);
  item.append(left, actions);
  return item;
}

function appendTag(parent, label, className) {
  const tag = document.createElement('span');
  tag.className = className;
  tag.textContent = label;
  parent.appendChild(tag);
}

function updateStatistics() {
  const completed = tasks.filter(task => task.completed).length;
  const active = tasks.length - completed;
  const percentage = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  todayTasksCount.textContent = String(tasks.filter(task => task.dueDate === TODAY()).length);
  activeTasksCount.textContent = String(active);
  completedTasksCount.textContent = String(completed);
  progressPercentage.textContent = `${percentage}%`;
  progressBarFill.style.width = `${percentage}%`;
  progressBarContainer.setAttribute('aria-valuenow', String(percentage));
  progressCaption.textContent = tasks.length === 0
    ? 'Time to romanticize your day ♡'
    : percentage === 0
      ? 'Ready to blossom, beautiful? 🌸'
      : percentage < 50
        ? 'Lovely start, keep blooming! ✨'
        : percentage < 100
          ? 'More than halfway there, gorgeous! 💗'
          : 'All finished! You’re iconic! 🎀🎉';
  allFinishedBanner.style.display = tasks.length > 0 && completed === tasks.length ? 'block' : 'none';
}

function emptyMessage() {
  const messages = {
    all: 'No little tasks yet! Time to romanticize your day ♡',
    today: 'No tasks are due today. Enjoy the breathing room ♡',
    upcoming: 'No upcoming tasks on your list yet 🌸',
    overdue: 'Nothing overdue. You are right on track ✨',
    completed: 'No completed tasks in this view just yet ♡'
  };
  if (taskSearchInput.value.trim()) return 'No tasks match that search. Try another word ♡';
  return messages[currentFilter] || messages.all;
}

function updateFocusTaskOptions() {
  const select = document.getElementById('timerTaskSelect');
  if (!select) return;
  const selectedValue = select.value;
  select.replaceChildren(new Option('✨ General Sweet Focus', ''));
  tasks.filter(task => !task.completed).forEach(task => {
    select.add(new Option(task.text, String(task.id)));
  });
  if ([...select.options].some(option => option.value === selectedValue)) select.value = selectedValue;
}

function isValidDate(value) {
  return taskUtils.isValidDate(value);
}

function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function showValidationError(message) {
  validationMsg.textContent = message;
  validationMsg.classList.add('visible');
  inputContainer.classList.add('error-shake');
  window.setTimeout(() => inputContainer.classList.remove('error-shake'), 500);
}

function clearValidationError() {
  validationMsg.textContent = '';
  validationMsg.classList.remove('visible');
  inputContainer.classList.remove('error-shake');
}

function showToast(message) {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add('toast-fadeout');
    window.setTimeout(() => toast.remove(), 300);
  }, 2600);
}

function initDailyReminder() {
  if (typeof PETAL_QUOTES === 'undefined' || !Array.isArray(PETAL_QUOTES) || !PETAL_QUOTES.length) {
    quoteCategory.textContent = 'A LITTLE REMINDER 💗';
    quoteText.textContent = 'You are doing better than you think ♡';
    return;
  }
  displayRandomQuote(true);
}

function displayRandomQuote(avoidRepeat) {
  const quotes = typeof PETAL_QUOTES === 'undefined' ? [] : PETAL_QUOTES;
  if (!Array.isArray(quotes) || !quotes.length) return;
  let options = quotes;
  let lastId = null;
  try {
    lastId = sessionStorage.getItem(QUOTE_STORAGE_KEY);
  } catch (error) {
    console.warn('Could not read the last displayed quote from session storage:', error);
  }
  if (avoidRepeat && lastId && quotes.length > 1) {
    options = quotes.filter(quote => String(quote.id) !== lastId);
  }
  currentQuote = options[Math.floor(Math.random() * options.length)];
  try {
    sessionStorage.setItem(QUOTE_STORAGE_KEY, String(currentQuote.id));
  } catch (error) {
    console.warn('Could not save the last displayed quote to session storage:', error);
  }
  quoteCategory.textContent = currentQuote.category;
  quoteText.textContent = currentQuote.text;
  updateFavoriteControls();
}

function updateGreeting() {
  const now = new Date();
  const hour = now.getHours();
  document.getElementById('greetingTimeText').textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('currentDateDisplay').textContent = now.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
}
