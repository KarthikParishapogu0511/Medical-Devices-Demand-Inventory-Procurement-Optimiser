import assert from 'assert';
import http from 'http';

const loginPayload = JSON.stringify({
  email: 'inventory_planner@hospital.com',
  password: 'password123'
});

const runTest = () => {
  console.log('Starting API Validation Tests...');

  // 1. Test Login
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginPayload)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        assert.strictEqual(res.statusCode, 200);
        assert.ok(data.token, 'Response should contain a JWT token');
        assert.strictEqual(data.user.role, 'Inventory Planner');
        console.log('✓ Test 1 Passed: Secure authentication succeeded.');

        // Run subsequent tests with token
        testDashboard(data.token);
      } catch (e) {
        console.error('✗ Test 1 Failed:', e.message);
        process.exit(1);
      }
    });
  });

  req.write(loginPayload);
  req.end();
};

const testDashboard = (token) => {
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/dashboard/summary',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        assert.strictEqual(res.statusCode, 200);
        assert.ok(data.total_items > 0, 'Should return total items');
        assert.ok(data.metrics.yield_rate > 0, 'Should return yield rate');
        console.log('✓ Test 2 Passed: Dashboard metrics successfully loaded.');

        testItemsList(token);
      } catch (e) {
        console.error('✗ Test 2 Failed:', e.message);
        process.exit(1);
      }
    });
  });
  req.end();
};

const testItemsList = (token) => {
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/items',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        assert.strictEqual(res.statusCode, 200);
        assert.ok(Array.isArray(data), 'Should return list of items');
        assert.ok(data.length > 0, 'List should contain at least one item');
        console.log('✓ Test 3 Passed: Items list fetched successfully.');
        console.log('All backend API tests completed successfully!');
        process.exit(0);
      } catch (e) {
        console.error('✗ Test 3 Failed:', e.message);
        process.exit(1);
      }
    });
  });
  req.end();
};

runTest();
