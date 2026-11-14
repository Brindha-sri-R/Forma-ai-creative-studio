import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { app } from '../server/src/app.js';
import { connectDatabase } from '../server/src/config/db.js';

function request(server, path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const addr = server.address();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n=============================================');
  console.log('  🧪 FORMA FULL-STACK AUTOMATED TEST SUITE');
  console.log('=============================================\n');

  await connectDatabase();

  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  console.log(`[Test Harness] Server ephemeral port: ${server.address().port}`);

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  try {
    // 1. Healthcheck
    const health = await request(server, '/api/health');
    assert(health.status === 200 && health.body.status === 'healthy', 'Health check returns 200 OK');

    // 2. Register
    const testEmail = `qa-${Date.now()}@forma.ai`;
    const regRes = await request(server, '/api/auth/register', 'POST', {
      email: testEmail,
      password: 'password123',
      name: 'QA Test Engineer',
    });
    assert(regRes.status === 201 && regRes.body.token, 'User registration returns 201 & JWT token');
    const token = regRes.body.token;

    // 3. Login
    const loginRes = await request(server, '/api/auth/login', 'POST', {
      email: testEmail,
      password: 'password123',
    });
    assert(loginRes.status === 200 && loginRes.body.token, 'User login succeeds with correct credentials');

    // 4. Protected /api/auth/me
    const meRes = await request(server, '/api/auth/me', 'GET', null, token);
    assert(meRes.status === 200 && meRes.body.user.email === testEmail, 'Protected /api/auth/me returns user profile');

    // 5. Image Generation (Demo synthesis)
    const genImage = await request(
      server,
      '/api/generate',
      'POST',
      {
        mode: 'image',
        prompt: 'Futuristic architectural pavilion with bioluminescent glass',
        style: 'Architectural',
        aspectRatio: '16:9',
        resolution: '2K',
        variations: 1,
      },
      token
    );
    assert(
      genImage.status === 201 && genImage.body.mediaUrl && genImage.body.creditsUsed === 1,
      'Image generation succeeds, deducts 1 credit and creates media file'
    );
    const creationId = genImage.body.id;

    // 6. Video Generation (Text-to-Video demo)
    const genVideo = await request(
      server,
      '/api/generate',
      'POST',
      {
        mode: 'video',
        prompt: 'Orbital rotation around geometric prism sculpture',
        aspectRatio: '16:9',
        duration: '4s',
        motion: 'Orbit',
        fps: '24 fps',
      },
      token
    );
    assert(
      genVideo.status === 201 && genVideo.body.mediaUrl && genVideo.body.creditsUsed === 4,
      'Video generation succeeds, deducts 4 credits and produces video sequence'
    );

    // 7. Gallery Listing
    const galleryRes = await request(server, '/api/creations', 'GET', null, token);
    assert(
      galleryRes.status === 200 && galleryRes.body.creations.length >= 2,
      'Gallery lists user generations correctly'
    );

    // 8. Gallery Update (Rename & Favorite)
    const updateRes = await request(
      server,
      `/api/creations/${creationId}`,
      'PATCH',
      {
        title: 'Bioluminescent Pavilion Masterpiece',
        saved: true,
        collection: 'Campaigns',
      },
      token
    );
    assert(
      updateRes.status === 200 &&
        updateRes.body.creation.title === 'Bioluminescent Pavilion Masterpiece' &&
        updateRes.body.creation.saved === true,
      'Creation successfully renamed and bookmarked/saved'
    );

    // 9. Collections CRUD
    const colCreate = await request(server, '/api/collections', 'POST', { name: 'Showcase 2026' }, token);
    assert(colCreate.status === 201 && colCreate.body.name === 'Showcase 2026', 'Collection created successfully');

    const colList = await request(server, '/api/collections', 'GET', null, token);
    assert(
      colList.status === 200 && colList.body.collections.includes('Showcase 2026'),
      'Collection listed in user collections'
    );

    // 10. Dashboard Stats
    const statsRes = await request(server, '/api/dashboard/stats', 'GET', null, token);
    assert(
      statsRes.status === 200 &&
        statsRes.body.stats.totalCreations >= 2 &&
        statsRes.body.stats.totalCreditsSpent >= 5,
      'Dashboard stats aggregates creations and credit transactions'
    );

    // 11. Duplicate Creation
    const dupRes = await request(server, `/api/creations/${creationId}/duplicate`, 'POST', null, token);
    assert(
      dupRes.status === 201 && dupRes.body.creation.title.includes('(Copy)'),
      'Duplicate creation creates cloned record'
    );

    // 12. Delete Creation
    const delRes = await request(server, `/api/creations/${dupRes.body.creation.id}`, 'DELETE', null, token);
    assert(delRes.status === 200, 'Creation deleted successfully');

    // 13. Plan Upgrade
    const planRes = await request(server, '/api/credits/plan', 'POST', { planId: 'pro' }, token);
    assert(
      planRes.status === 200 && planRes.body.credits === 500 && planRes.body.planId === 'pro',
      'Plan upgrade to Pro allocates 500 credits'
    );

    console.log(`\n=============================================`);
    console.log(`  🎉 TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
    console.log(`=============================================\n`);

    server.close();
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err);
    server.close();
    process.exit(1);
  }
}

runTests();

