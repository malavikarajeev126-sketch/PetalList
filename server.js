// =============================================================================
// PetalList 🎀 - Express Server & REST API
// Enhanced with Categories, Priorities, Due Dates & Habit Garden
// =============================================================================

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------------------------
// Persistence Store (JSON file with fallback)
// Keeps data persistent across server restarts without external database!
// -----------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = process.env.PETALLIST_STORE_FILE
  ? path.resolve(process.env.PETALLIST_STORE_FILE)
  : path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
const STORE_DIR = path.dirname(STORE_FILE);
if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

// Initial Starter Data
const DEFAULT_STORE = {
  nextTaskId: 5,
  nextHabitId: 5,
  tasks: [
    {
      id: 1,
      text: "Romanticize morning coffee & plan the day ☕🌸",
      completed: true,
      category: "Personal",
      priority: "Low",
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      text: "Finish the Web Dev lab assignment before panic sets in ♡",
      completed: false,
      category: "College",
      priority: "High",
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      text: "Debug the cute button hover transitions 💻✨",
      completed: false,
      category: "Coding",
      priority: "Medium",
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 4,
      text: "Evening skincare routine & berry chamomile tea 🫧🫖",
      completed: false,
      category: "Self-care",
      priority: "Low",
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  habits: [
    {
      id: 1,
      name: "Drink 2L iced water 💧",
      icon: "💧",
      completedDates: [new Date().toISOString().split('T')[0]],
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Read 10 cozy pages 📖",
      icon: "📖",
      completedDates: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: "Gentle stretch & posture check 🩰",
      icon: "🩰",
      completedDates: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      name: "Daily skincare glow 🫧",
      icon: "🫧",
      completedDates: [new Date().toISOString().split('T')[0]],
      createdAt: new Date().toISOString()
    }
  ]
};

// In-Memory state loaded from file
let store = { ...DEFAULT_STORE };

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      store = {
        nextTaskId: parsed.nextTaskId || DEFAULT_STORE.nextTaskId,
        nextHabitId: parsed.nextHabitId || DEFAULT_STORE.nextHabitId,
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : DEFAULT_STORE.tasks,
        habits: Array.isArray(parsed.habits) ? parsed.habits : DEFAULT_STORE.habits
      };
    } else {
      saveStore(store);
    }
  } catch (err) {
    console.warn('Could not read store.json, using defaults:', err.message);
    store = { ...DEFAULT_STORE };
  }
}

function saveStore(nextStore) {
  const temporaryFile = `${STORE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(nextStore, null, 2), 'utf8');
  fs.renameSync(temporaryFile, STORE_FILE);
}

function commitStore(update) {
  const nextStore = JSON.parse(JSON.stringify(store));
  const result = update(nextStore);
  saveStore(nextStore);
  store = nextStore;
  return result;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function isObjectBody(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Initial load
loadStore();

// Allowed Categories & Priorities
const VALID_CATEGORIES = ['College', 'Coding', 'Personal', 'Self-care'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

// -----------------------------------------------------------------------------
// Task Endpoints
// -----------------------------------------------------------------------------

/**
 * GET /api/tasks
 * Returns all to-do tasks.
 */
app.get('/api/tasks', (req, res) => {
  res.status(200).json(store.tasks);
});

/**
 * POST /api/tasks
 * Creates a new to-do task with category, priority, and optional due date.
 * Request body: { text, category?, priority?, dueDate? }
 */
app.post('/api/tasks', (req, res) => {
  if (req.body !== undefined && !isObjectBody(req.body)) {
    return res.status(400).json({ error: 'Task creation must be sent as a JSON object.' });
  }
  const body = req.body || {};
  const { text, category, priority, dueDate } = body;

  // Validation: text must be non-empty string
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({
      error: 'Please enter a valid task description, sweetie! Empty tasks are not allowed ♡'
    });
  }
  if (text.trim().length > 200) {
    return res.status(400).json({ error: 'Task descriptions must be 200 characters or fewer.' });
  }

  // Validate or default category
  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Please choose a valid task category.' });
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: 'Please choose a valid task priority.' });
  }

  if (dueDate !== undefined && dueDate !== null && dueDate !== '' && !isValidDate(dueDate)) {
    return res.status(400).json({ error: 'Due date must be a real date in YYYY-MM-DD format.' });
  }

  const newTask = commitStore(nextStore => {
    const now = new Date().toISOString();
    const task = {
      id: nextStore.nextTaskId++,
      text: text.trim(),
      completed: false,
      category: category || 'Personal',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      createdAt: now,
      updatedAt: now
    };
    nextStore.tasks.push(task);
    return task;
  });

  return res.status(201).json(newTask);
});

/**
 * PATCH /api/tasks/:id
 * Toggles a task's completion or edits its content (text, category, priority, dueDate).
 */
app.patch('/api/tasks/:id', (req, res) => {
  const taskId = parseId(req.params.id);

  if (taskId === null) {
    return res.status(400).json({ error: 'Invalid task ID format. It must be a number.' });
  }

  if (!store.tasks.some(t => t.id === taskId)) {
    return res.status(404).json({ error: `Task with ID #${taskId} was not found ♡` });
  }

  if (req.body !== undefined && !isObjectBody(req.body)) {
    return res.status(400).json({ error: 'Task updates must be sent as a JSON object.' });
  }
  const body = req.body || {};
  if (body.completed !== undefined && typeof body.completed !== 'boolean') {
    return res.status(400).json({ error: 'Task completion must be true or false.' });
  }
  if (body.text !== undefined) {
    if (typeof body.text !== 'string' || body.text.trim() === '') {
      return res.status(400).json({ error: 'Task description cannot be empty ♡' });
    }
    if (body.text.trim().length > 200) {
      return res.status(400).json({ error: 'Task descriptions must be 200 characters or fewer.' });
    }
  }
  if (body.category !== undefined && !VALID_CATEGORIES.includes(body.category)) {
    return res.status(400).json({ error: 'Please choose a valid task category.' });
  }
  if (body.priority !== undefined && !VALID_PRIORITIES.includes(body.priority)) {
    return res.status(400).json({ error: 'Please choose a valid task priority.' });
  }
  if (body.dueDate !== undefined && body.dueDate !== null && body.dueDate !== '' && !isValidDate(body.dueDate)) {
    return res.status(400).json({ error: 'Due date must be a real date in YYYY-MM-DD format.' });
  }

  const updatedTask = commitStore(nextStore => {
    const task = nextStore.tasks.find(t => t.id === taskId);
    if (body.completed !== undefined) {
      task.completed = body.completed;
    } else if (Object.keys(body).length === 0) {
      task.completed = !task.completed;
    }
    if (body.text !== undefined) task.text = body.text.trim();
    if (body.category !== undefined) task.category = body.category;
    if (body.priority !== undefined) task.priority = body.priority;
    if (body.dueDate !== undefined) task.dueDate = body.dueDate || null;
    task.updatedAt = new Date().toISOString();
    return task;
  });

  return res.status(200).json(updatedTask);
});

app.patch('/api/tasks', (req, res) => {
  return res.status(400).json({ error: 'A task ID is required.' });
});

/**
 * DELETE /api/tasks/:id
 * Deletes a task by ID.
 */
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = parseId(req.params.id);

  if (taskId === null) {
    return res.status(400).json({ error: 'Invalid task ID format. It must be a number.' });
  }

  if (!store.tasks.some(t => t.id === taskId)) {
    return res.status(404).json({ error: `Task with ID #${taskId} was not found ♡` });
  }

  const deletedTask = commitStore(nextStore => {
    const taskIndex = nextStore.tasks.findIndex(t => t.id === taskId);
    return nextStore.tasks.splice(taskIndex, 1)[0];
  });

  return res.status(200).json({
    message: 'Task deleted successfully! Bloom on 🌸',
    task: deletedTask
  });
});

app.delete('/api/tasks', (req, res) => {
  return res.status(400).json({ error: 'A task ID is required.' });
});

/**
 * POST /api/tasks/sync
 * Bulk synchronization endpoint: keeps client localStorage and server aligned.
 * Preserves existing data smoothly while adopting new fields.
 */
app.post('/api/tasks/sync', (req, res) => {
  if (!isObjectBody(req.body)) {
    return res.status(400).json({ error: 'Task synchronization requires a JSON object.' });
  }
  const { clientTasks } = req.body;

  if (Array.isArray(clientTasks) && clientTasks.length > 0) {
    const validTasks = clientTasks
      .filter(t => t && typeof t.text === 'string' && t.text.trim() !== '' && t.text.trim().length <= 200)
      .map((t, idx) => ({
        id: typeof t.id === 'number' ? t.id : store.nextTaskId + idx,
        text: t.text.trim(),
        completed: Boolean(t.completed),
        category: VALID_CATEGORIES.includes(t.category) ? t.category : 'Personal',
        priority: VALID_PRIORITIES.includes(t.priority) ? t.priority : 'Medium',
        dueDate: isValidDate(t.dueDate) ? t.dueDate : null,
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: t.updatedAt || new Date().toISOString()
      }));

    commitStore(nextStore => {
      nextStore.tasks = validTasks;
      const maxId = nextStore.tasks.reduce((max, t) => Math.max(max, t.id), 0);
      nextStore.nextTaskId = Math.max(nextStore.nextTaskId, maxId + 1);
    });
  }

  return res.status(200).json(store.tasks);
});

// -----------------------------------------------------------------------------
// Habit Garden Endpoints
// -----------------------------------------------------------------------------

/**
 * GET /api/habits
 * Returns all habits and their completed date history.
 */
app.get('/api/habits', (req, res) => {
  res.status(200).json(store.habits);
});

/**
 * POST /api/habits
 * Creates a new habit.
 * Request body: { name, icon? }
 */
app.post('/api/habits', (req, res) => {
  if (req.body !== undefined && !isObjectBody(req.body)) {
    return res.status(400).json({ error: 'Habit creation must be sent as a JSON object.' });
  }
  const body = req.body || {};
  const { name, icon } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Please enter a habit name to grow your garden, sweetie! ♡'
    });
  }

  if (name.trim().length > 60) {
    return res.status(400).json({ error: 'Habit names must be 60 characters or fewer.' });
  }

  const newHabit = commitStore(nextStore => {
    const habit = {
      id: nextStore.nextHabitId++,
      name: name.trim(),
      icon: typeof icon === 'string' && icon.trim() ? icon.trim() : '🌸',
      completedDates: [],
      createdAt: new Date().toISOString()
    };
    nextStore.habits.push(habit);
    return habit;
  });

  return res.status(201).json(newHabit);
});

/**
 * PATCH /api/habits/:id/toggle
 * Toggles today's completion for a habit.
 * Prevents duplicate completion on the same date.
 * Optional body: { date: "YYYY-MM-DD" } (defaults to today in UTC/local)
 */
app.patch('/api/habits/:id/toggle', (req, res) => {
  const habitId = parseId(req.params.id);

  if (habitId === null) {
    return res.status(400).json({ error: 'Invalid habit ID format.' });
  }

  if (!store.habits.some(h => h.id === habitId)) {
    return res.status(404).json({ error: `Habit with ID #${habitId} was not found ♡` });
  }

  if (req.body !== undefined && !isObjectBody(req.body)) {
    return res.status(400).json({ error: 'Habit completion must be sent as a JSON object.' });
  }
  const body = req.body || {};
  let targetDate = new Date().toISOString().split('T')[0];
  if (body.date !== undefined) {
    if (!isValidDate(body.date)) {
      return res.status(400).json({ error: 'Habit date must be a real date in YYYY-MM-DD format.' });
    }
    targetDate = body.date;
  }

  const updatedHabit = commitStore(nextStore => {
    const habit = nextStore.habits.find(h => h.id === habitId);
    if (!Array.isArray(habit.completedDates)) habit.completedDates = [];
    const dateIndex = habit.completedDates.indexOf(targetDate);
    if (dateIndex > -1) {
      habit.completedDates.splice(dateIndex, 1);
    } else {
      habit.completedDates.push(targetDate);
    }
    return habit;
  });
  return res.status(200).json(updatedHabit);
});

/**
 * DELETE /api/habits/:id
 * Deletes a habit by ID.
 */
app.delete('/api/habits/:id', (req, res) => {
  const habitId = parseId(req.params.id);

  if (habitId === null) {
    return res.status(400).json({ error: 'Invalid habit ID format.' });
  }

  if (!store.habits.some(h => h.id === habitId)) {
    return res.status(404).json({ error: `Habit with ID #${habitId} was not found ♡` });
  }

  const deletedHabit = commitStore(nextStore => {
    const habitIndex = nextStore.habits.findIndex(h => h.id === habitId);
    return nextStore.habits.splice(habitIndex, 1)[0];
  });

  return res.status(200).json({
    message: 'Habit removed from your garden 🌷',
    habit: deletedHabit
  });
});

app.delete('/api/habits', (req, res) => {
  return res.status(400).json({ error: 'A habit ID is required.' });
});

/**
 * POST /api/habits/sync
 * Bulk sync for habits from localStorage.
 */
app.post('/api/habits/sync', (req, res) => {
  if (!isObjectBody(req.body)) {
    return res.status(400).json({ error: 'Habit synchronization requires a JSON object.' });
  }
  const { clientHabits } = req.body;

  if (Array.isArray(clientHabits) && clientHabits.length > 0) {
    const validHabits = clientHabits
      .filter(h => h && typeof h.name === 'string' && h.name.trim() !== '')
      .map((h, idx) => ({
        id: typeof h.id === 'number' ? h.id : store.nextHabitId + idx,
        name: h.name.trim(),
        icon: h.icon || '🌸',
        completedDates: Array.isArray(h.completedDates) ? [...new Set(h.completedDates)] : [],
        createdAt: h.createdAt || new Date().toISOString()
      }));

    if (validHabits.length > 0) {
      commitStore(nextStore => {
        nextStore.habits = validHabits;
        const maxId = nextStore.habits.reduce((max, h) => Math.max(max, h.id), 0);
        nextStore.nextHabitId = Math.max(nextStore.nextHabitId, maxId + 1);
      });
    }
  }

  return res.status(200).json(store.habits);
});

app.use((err, req, res, next) => {
  console.error('Request failed:', err.message);
  if (res.headersSent) {
    return next(err);
  }
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
  const message = status < 500
    ? err.message
    : 'The request could not be saved. Please try again.';
  return res.status(status).json({ error: message });
});

// -----------------------------------------------------------------------------
// Start the Express server
// -----------------------------------------------------------------------------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌸 PetalList is blooming sweetly at: http://localhost:${PORT} 🎀`);
  });
}

module.exports = app;
