// =============================================================================
// PetalList 🎀 - Express Server & REST API
// A beginner-friendly, girly to-do application backend
// =============================================================================

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------
// Parse incoming requests with JSON payloads
app.use(express.json());

// Serve static frontend assets (HTML, CSS, JS, images) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------------------------
// In-Memory Database
// Note: This in-memory array will reset if the server restarts.
// The frontend uses browser localStorage to keep tasks preserved on the client!
// -----------------------------------------------------------------------------
let tasks = [
  {
    id: 1,
    text: "Romanticize your morning coffee ☕🌸",
    completed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    text: "Finish that assignment before the panic sets in ♡",
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    text: "Drink some ice water and hydrate, pretty girl ✨",
    completed: false,
    createdAt: new Date().toISOString()
  }
];

// Auto-increment ID counter (ensures unique IDs)
let nextId = 4;

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------

/**
 * GET /api/tasks
 * Returns all to-do tasks in the list.
 */
app.get('/api/tasks', (req, res) => {
  res.status(200).json(tasks);
});

/**
 * POST /api/tasks
 * Creates a new to-do task.
 * Request body: { text: "Task description" }
 */
app.post('/api/tasks', (req, res) => {
  const { text } = req.body;

  // Validation: Check if text exists and is not just whitespace
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({
      error: 'Please enter a valid task description, sweetie! Empty tasks are not allowed ♡'
    });
  }

  const newTask = {
    id: nextId++,
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);

  return res.status(201).json(newTask);
});

/**
 * PATCH /api/tasks/:id
 * Toggles a task's completion status, or updates specific fields.
 * Request params: id (task ID)
 * Optional body: { completed: boolean }
 */
app.patch('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);

  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID format. It must be a number.' });
  }

  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: `Task with ID #${taskId} was not found ♡` });
  }

  // If a specific completed value is supplied in body, use it; otherwise toggle
  if (typeof req.body.completed === 'boolean') {
    task.completed = req.body.completed;
  } else {
    task.completed = !task.completed;
  }

  return res.status(200).json(task);
});

/**
 * DELETE /api/tasks/:id
 * Deletes a task by ID.
 * Request params: id (task ID)
 */
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);

  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID format. It must be a number.' });
  }

  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task with ID #${taskId} was not found ♡` });
  }

  // Remove the task from the array
  const [deletedTask] = tasks.splice(taskIndex, 1);

  return res.status(200).json({
    message: 'Task deleted successfully! Bloom on 🌸',
    task: deletedTask
  });
});

/**
 * POST /api/tasks/sync
 * Bulk synchronization endpoint: allows frontend to restore or sync tasks
 * from localStorage when the server has restarted or when initializing.
 */
app.post('/api/tasks/sync', (req, res) => {
  const { clientTasks } = req.body;

  if (Array.isArray(clientTasks) && clientTasks.length > 0) {
    // Only accept valid task objects
    const validTasks = clientTasks
      .filter(t => t && typeof t.text === 'string' && t.text.trim() !== '')
      .map((t, idx) => ({
        id: typeof t.id === 'number' ? t.id : nextId + idx,
        text: t.text.trim(),
        completed: Boolean(t.completed),
        createdAt: t.createdAt || new Date().toISOString()
      }));

    if (validTasks.length > 0) {
      tasks = validTasks;
      // Update nextId to be higher than any existing task ID
      const maxId = tasks.reduce((max, t) => Math.max(max, t.id), 0);
      nextId = Math.max(nextId, maxId + 1);
    }
  }

  return res.status(200).json(tasks);
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
