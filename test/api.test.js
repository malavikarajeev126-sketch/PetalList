// =============================================================================
// PetalList 🎀 - Automated API & Quality Verification Test Suite
// =============================================================================

const http = require('http');
const app = require('../server');
const quotes = require('../public/quotes');

const PORT = 3099;
let server;

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
  console.log('🎀 Starting PetalList Test Suite...\n');
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

  // 1. Verify Quotes Count & Structure
  console.log('🌸 Test 1: Quotes Collection Quality Check');
  assert(Array.isArray(quotes), 'Quotes is an array');
  assert(quotes.length >= 60, `Quotes array has at least 60 items (found ${quotes.length})`);
  const hasValidProps = quotes.every(q => q.id && q.category && q.text && typeof q.text === 'string');
  assert(hasValidProps, 'All quotes have valid id, category, and text');

  // Start test server
  server = app.listen(PORT);

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
    const initialCount = getRes.data.length;

    // 3. POST /api/tasks (Valid task)
    console.log('\n🌸 Test 3: POST /api/tasks (Create Task)');
    const postRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/tasks',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { text: 'Bake strawberry cupcakes 🧁🌸' });

    assert(postRes.statusCode === 201, 'POST /api/tasks returns status 201');
    assert(postRes.data && postRes.data.text === 'Bake strawberry cupcakes 🧁🌸', 'Created task has correct text');
    assert(postRes.data && postRes.data.completed === false, 'Created task is initially active (completed: false)');
    assert(postRes.data && typeof postRes.data.id === 'number', 'Created task has numeric ID');
    const createdId = postRes.data.id;

    // 4. POST /api/tasks (Empty/Whitespace validation)
    console.log('\n🌸 Test 4: POST /api/tasks (Validation Check)');
    const emptyRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/tasks',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { text: '    ' });
    assert(emptyRes.statusCode === 400, 'Empty/whitespace-only task returns status 400');
    assert(emptyRes.data && emptyRes.data.error, 'Returns friendly error message');

    // 5. PATCH /api/tasks/:id (Toggle complete)
    console.log('\n🌸 Test 5: PATCH /api/tasks/:id (Toggle Status)');
    const patchRes1 = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/tasks/${createdId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    assert(patchRes1.statusCode === 200, 'PATCH returns status 200');
    assert(patchRes1.data && patchRes1.data.completed === true, 'Task completed status was toggled to true');

    // Toggle back to active
    const patchRes2 = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/tasks/${createdId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    assert(patchRes2.data && patchRes2.data.completed === false, 'Task completed status toggled back to false');

    // 6. PATCH /api/tasks/:id (Invalid ID / 404)
    console.log('\n🌸 Test 6: PATCH /api/tasks/99999 (Not Found)');
    const patch404 = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/tasks/99999`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    assert(patch404.statusCode === 404, 'Non-existent task ID returns 404');

    // 7. DELETE /api/tasks/:id
    console.log('\n🌸 Test 7: DELETE /api/tasks/:id');
    const deleteRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/tasks/${createdId}`,
      method: 'DELETE'
    });
    assert(deleteRes.statusCode === 200, 'DELETE returns status 200');
    assert(deleteRes.data && deleteRes.data.task && deleteRes.data.task.id === createdId, 'Returns deleted task details');

    // 8. DELETE /api/tasks/99999 (Not Found)
    console.log('\n🌸 Test 8: DELETE /api/tasks/99999 (Not Found)');
    const delete404 = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: `/api/tasks/99999`,
      method: 'DELETE'
    });
    assert(delete404.statusCode === 404, 'Deleting non-existent task returns 404');

    // 9. Static Files Serving
    console.log('\n🌸 Test 9: Static Files Serving');
    const indexRes = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/',
      method: 'GET'
    });
    assert(indexRes.statusCode === 200, 'GET / serves index.html with status 200');
    assert(typeof indexRes.data === 'string' && indexRes.data.includes('PetalList 🎀'), 'index.html contains app title');

    console.log(`\n==========================================`);
    console.log(`🌸 Results: ${passed} Passed, ${failed} Failed`);
    console.log(`==========================================\n`);

  } finally {
    server.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  if (server) server.close();
  process.exit(1);
});
