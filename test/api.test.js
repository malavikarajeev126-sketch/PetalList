// =============================================================================
// PetalList 🎀 - Automated API & Quality Verification Test Suite
// Tests Tasks CRUD, Categories, Priorities, Due Dates, and Habit Garden
// =============================================================================

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const quotes = require('../public/quotes');
const taskUtils = require('../public/task-utils');

let PORT = 0;
const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'petallist-api-test-'));
const testStorePath = path.join(testDirectory, 'store.json');
process.env.PETALLIST_STORE_FILE = testStorePath;
const app = require('../server');
let server;

function cleanTestStore() {
  for (const file of [testStorePath, `${testStorePath}.${process.pid}.tmp`]) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  if (fs.existsSync(testDirectory)) fs.rmdirSync(testDirectory);
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = body ? JSON.parse(body) : null;
        } catch (e) {
          parsed = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🎀 Starting Enhanced PetalList Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Verify Quotes Collection
  console.log('🌸 Test 1: Quotes Collection Quality Check');
  assert(Array.isArray(quotes), 'Quotes is an array');
  assert(quotes.length >= 60, `Quotes array has at least 60 items (found ${quotes.length})`);
  const hasValidProps = quotes.every(q => q.id && q.category && q.text && typeof q.text === 'string');
  assert(hasValidProps, 'All quotes have valid id, category, and text');

  console.log('\n🌸 Test 1a: Task Filtering & Sorting');
  const filterFixture = [
    { id: 1, text: 'Today study', dueDate: '2026-10-14', completed: false, priority: 'Medium' },
    { id: 2, text: 'Future study', dueDate: '2026-10-15', completed: false, priority: 'High' },
    { id: 3, text: 'Past study', dueDate: '2026-10-13', completed: false, priority: 'Low' },
    { id: 4, text: 'Finished past study', dueDate: '2026-10-13', completed: true, priority: 'High' },
    { id: 5, text: 'Unscheduled task', dueDate: null, completed: false, priority: 'Medium' }
  ];
  const idsFor = (filter, search = '') => taskUtils.filterTasks(filterFixture, filter, search, '2026-10-14').map(task => task.id);
  assert(idsFor('today').join(',') === '1', 'Today filter includes tasks due today');
  assert(idsFor('upcoming').join(',') === '2', 'Upcoming filter excludes completed and undated tasks');
  assert(idsFor('overdue').join(',') === '3', 'Overdue filter excludes completed tasks');
  assert(idsFor('completed').join(',') === '4', 'Completed filter includes completed tasks');
  assert(idsFor('all', 'FUTURE').join(',') === '2', 'Task search is case-insensitive');
  assert(taskUtils.sortTasks(filterFixture, 'priority')[0].id === 2, 'Priority sorting puts high priority first');
  assert(taskUtils.isValidDate('2024-02-29') && !taskUtils.isValidDate('2026-02-30'), 'Calendar date validation handles leap days and impossible dates');

  server = app.listen(PORT);
  await new Promise(resolve => server.once('listening', resolve));
  PORT = server.address().port;

  try {
    // 2. GET /api/tasks
    console.log('\n🌸 Test 2: GET /api/tasks');
    const getRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/tasks',
      method: 'GET'
    });
    assert(getRes.statusCode === 200, 'GET /api/tasks returns status 200');
    assert(Array.isArray(getRes.data), 'GET /api/tasks returns an array');

    // 3. POST /api/tasks with Category, Priority, Due Date
    console.log('\n🌸 Test 3: POST /api/tasks (Smart Task Creation)');
    const postRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/tasks',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      text: 'Submit Machine Learning Lab Report 💻📑',
      category: 'College',
      priority: 'High',
      dueDate: '2026-10-20'
    });

    assert(postRes.statusCode === 201, 'POST /api/tasks returns status 201');
    assert(postRes.data && postRes.data.text === 'Submit Machine Learning Lab Report 💻📑', 'Created task has correct text');
    assert(postRes.data && postRes.data.category === 'College', 'Task category is "College"');
    assert(postRes.data && postRes.data.priority === 'High', 'Task priority is "High"');
    assert(postRes.data && postRes.data.dueDate === '2026-10-20', 'Task dueDate is "2026-10-20"');
    assert(postRes.data && postRes.data.completed === false, 'New task is active');
    const createdTaskId = postRes.data.id;

    // 3a. Reject impossible dates and malformed IDs.
    const invalidDateRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/tasks',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { text: 'Invalid calendar date', dueDate: '2026-02-30' });
    assert(invalidDateRes.statusCode === 400, 'Impossible due date is rejected');

    const invalidIdRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/tasks/1abc',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, { completed: true });
    assert(invalidIdRes.statusCode === 400, 'Malformed task ID is rejected');

    const missingIdRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/tasks',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, { completed: true });
    assert(missingIdRes.statusCode === 400, 'Missing task ID is rejected with a JSON error');

    const invalidPatchBodyRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/tasks/${createdTaskId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, 'null');
    assert(invalidPatchBodyRes.statusCode === 400, 'Non-object task updates are rejected');

    // 4. POST /api/tasks Validation (Empty description)
    console.log('\n🌸 Test 4: POST /api/tasks Validation Check');
    const emptyRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/tasks',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { text: '     ' });
    assert(emptyRes.statusCode === 400, 'Empty task returns status 400');
    assert(emptyRes.data && emptyRes.data.error, 'Returns friendly error message');

    const malformedJsonRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/tasks',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, '{"text":');
    assert(malformedJsonRes.statusCode === 400, 'Malformed JSON is rejected with a client error');
    assert(malformedJsonRes.data && malformedJsonRes.data.error, 'Malformed JSON returns a JSON error');

    // 5. PATCH /api/tasks/:id (Edit Task Content & Toggle)
    console.log('\n🌸 Test 5: PATCH /api/tasks/:id (Edit & Toggle)');
    const editRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/tasks/${createdTaskId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, {
      text: 'Submit Machine Learning Lab Report & Presentation 💻🎀',
      category: 'Self-care',
      priority: 'Medium',
      dueDate: '2026-10-21',
      completed: true
    });
    assert(editRes.statusCode === 200, 'PATCH returns status 200');
    assert(editRes.data && editRes.data.text.includes('Presentation'), 'Task text was edited successfully');
    assert(editRes.data && editRes.data.category === 'Self-care', 'Task category was updated');
    assert(editRes.data && editRes.data.priority === 'Medium', 'Priority was updated to Medium');
    assert(editRes.data && editRes.data.dueDate === '2026-10-21', 'Due date was updated');
    assert(editRes.data && editRes.data.completed === true, 'Task completed status set to true');
    const invalidEditDateRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/tasks/${createdTaskId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, { dueDate: '2026-02-30' });
    assert(invalidEditDateRes.statusCode === 400, 'Impossible edited due date is rejected');
    const persistedStore = JSON.parse(fs.readFileSync(testStorePath, 'utf8'));
    const persistedTask = persistedStore.tasks.find(task => task.id === createdTaskId);
    assert(persistedTask && persistedTask.text === editRes.data.text && persistedTask.dueDate === '2026-10-21', 'Rejected edit leaves saved task data unchanged');

    // 6. DELETE /api/tasks/:id
    console.log('\n🌸 Test 6: DELETE /api/tasks/:id');
    const deleteRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/tasks/${createdTaskId}`,
      method: 'DELETE'
    });
    assert(deleteRes.statusCode === 200, 'DELETE returns status 200');
    assert(deleteRes.data && deleteRes.data.task.id === createdTaskId, 'Correct task deleted');

    // 7. GET /api/habits
    console.log('\n🌸 Test 7: GET /api/habits (Habit Garden)');
    const getHabitsRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/habits',
      method: 'GET'
    });
    assert(getHabitsRes.statusCode === 200, 'GET /api/habits returns status 200');
    assert(Array.isArray(getHabitsRes.data), 'GET /api/habits returns an array');

    // 8. POST /api/habits
    console.log('\n🌸 Test 8: POST /api/habits (Add Habit)');
    const postHabitRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/habits',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Journal thoughts & gratitude 📝',
      icon: '📝'
    });
    assert(postHabitRes.statusCode === 201, 'POST /api/habits returns status 201');
    assert(postHabitRes.data && postHabitRes.data.name === 'Journal thoughts & gratitude 📝', 'Habit created with correct name');
    const habitId = postHabitRes.data.id;
    const invalidHabitBody = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/habits/${habitId}/toggle`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, 'null');
    assert(invalidHabitBody.statusCode === 400, 'Non-object habit updates are rejected');

    // 9. PATCH /api/habits/:id/toggle (Toggle today's completion)
    console.log('\n🌸 Test 9: PATCH /api/habits/:id/toggle (Habit Toggle & Dedup)');
    const today = new Date().toISOString().split('T')[0];
    const toggle1 = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/habits/${habitId}/toggle`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, { date: today });
    assert(toggle1.statusCode === 200, 'Toggle habit status 200');
    assert(toggle1.data.completedDates.includes(today), 'Habit marked completed for today');
    const invalidHabitDate = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/habits/${habitId}/toggle`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, { date: '2026-02-30' });
    assert(invalidHabitDate.statusCode === 400, 'Impossible habit date is rejected');

    // Toggle again should unmark (or toggle off) without creating duplicate
    const toggle2 = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/habits/${habitId}/toggle`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, { date: today });
    assert(!toggle2.data.completedDates.includes(today), 'Habit unmarked cleanly');
    const persistedHabitStore = JSON.parse(fs.readFileSync(testStorePath, 'utf8'));
    assert(persistedHabitStore.habits.some(habit => habit.id === habitId), 'Habit changes are persisted to the JSON store');

    // 10. DELETE /api/habits/:id
    console.log('\n🌸 Test 10: DELETE /api/habits/:id');
    const deleteHabitRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/habits/${habitId}`,
      method: 'DELETE'
    });
    assert(deleteHabitRes.statusCode === 200, 'DELETE habit returns status 200');
    const missingHabitIdRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/habits',
      method: 'DELETE'
    });
    assert(missingHabitIdRes.statusCode === 400, 'Missing habit ID is rejected with a JSON error');

    console.log(`\n==========================================`);
    console.log(`🌸 Results: ${passed} Passed, ${failed} Failed`);
    console.log(`==========================================\n`);

  } finally {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    cleanTestStore();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  if (server) server.close();
  cleanTestStore();
  process.exit(1);
});
