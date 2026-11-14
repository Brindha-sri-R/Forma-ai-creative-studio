import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:5050';

async function runRegression() {
  console.log('\n======================================================');
  console.log('  🧪 FORMA FULL REGRESSION TEST SUITE');
  console.log('======================================================\n');

  // 1. Authentication
  console.log('1. Authentication Testing...');
  const userA_email = `creator_${Date.now()}@test.in`;
  const userB_email = `other_${Date.now()}@test.in`;

  // Signup User A
  const signupA = await axios.post(`${BASE}/api/auth/signup`, {
    email: userA_email,
    password: 'Password123!',
    fullName: 'Creator Alpha',
  });
  console.log(`  ✓ User A Signup: 201 (Token: ${signupA.data.token.slice(0, 15)}..., Credits: ${signupA.data.user.credits})`);
  const tokenA = signupA.data.token;

  // Signup User B
  const signupB = await axios.post(`${BASE}/api/auth/signup`, {
    email: userB_email,
    password: 'Password123!',
    fullName: 'Creator Beta',
  });
  console.log(`  ✓ User B Signup: 201 (Credits: ${signupB.data.user.credits})`);
  const tokenB = signupB.data.token;

  // Signin Verification
  const signinA = await axios.post(`${BASE}/api/auth/signin`, {
    email: userA_email,
    password: 'Password123!',
  });
  if (signinA.status !== 200 || !signinA.data.token) {
    throw new Error('User A signin failed');
  }
  console.log('  ✓ User A Signin: 200 OK');

  // Verify /me persistence
  const meA = await axios.get(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  if (meA.data.user.email !== userA_email) throw new Error('Auth persistence mismatch');
  console.log('  ✓ Authentication persistence verified via /api/auth/me\n');

  // 2. Real Image Generation & Binary Verification
  console.log('2. Real AI Image Generation & Binary Verification...');
  const initialCreditsA = meA.data.user.credits;
  const genA = await axios.post(
    `${BASE}/api/generate`,
    {
      mode: 'image',
      prompt: 'A minimalist porcelain tea cup on dark slate, dramatic soft window light',
      aspectRatio: '1:1',
      model: 'free-flux-schnell',
    },
    { headers: { Authorization: `Bearer ${tokenA}` }, timeout: 90000 }
  );

  if (genA.status !== 201 || !genA.data.mediaUrl) {
    throw new Error('Image generation failed');
  }
  const creationA = genA.data;
  console.log(`  ✓ Generation created: ID=${creationA.id}, URL=${creationA.mediaUrl}, Dimensions=${creationA.dimensions}`);

  // Disk validation
  const filenameA = path.basename(creationA.mediaUrl);
  const diskPathA = path.resolve('uploads/creations', filenameA);
  if (!fs.existsSync(diskPathA)) throw new Error('File not saved to disk');
  const bufA = fs.readFileSync(diskPathA);
  const isJpegA = bufA[0] === 0xff && bufA[1] === 0xd8 && bufA[2] === 0xff;
  if (!isJpegA || bufA.length < 5000) throw new Error('Invalid JPEG binary');
  console.log(`  ✓ Disk file verified: ${filenameA} (${bufA.length} bytes, Magic: FF D8 FF)\n`);

  // 3. Credit Deductions
  console.log('3. Credit Deduction Integrity...');
  const meAAfterGen = await axios.get(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const creditsAfterGen = meAAfterGen.data.user.credits;
  console.log(`  Credits Initial: ${initialCreditsA} | After 1 Generation: ${creditsAfterGen}`);
  if (creditsAfterGen !== initialCreditsA - 1) throw new Error('Credit deduction incorrect');
  console.log('  ✓ Exactly 1 credit deducted on successful generation');

  // Test zero deduction on quota exhaustion
  const failedGen = await axios.post(
    `${BASE}/api/generate`,
    {
      mode: 'image',
      prompt: 'Test quota limit',
      model: 'gemini-3.1-flash-image',
    },
    { headers: { Authorization: `Bearer ${tokenA}` }, validateStatus: () => true }
  );
  console.log(`  Gemini Quota Response: HTTP ${failedGen.status} (${failedGen.data.details?.errorType})`);
  const meAAfterQuota = await axios.get(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  if (meAAfterQuota.data.user.credits !== creditsAfterGen) {
    throw new Error('Credits were deducted on quota-exhausted request!');
  }
  console.log(`  Credits After Quota Call: ${meAAfterQuota.data.user.credits} (Zero credits deducted!)\n`);

  // 4. Gallery Operations
  console.log('4. Gallery Operations (List, Update Title, Bookmark Save)...');
  const galleryList = await axios.get(`${BASE}/api/creations`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const foundA = galleryList.data.creations?.find((c: any) => c.id === creationA.id);
  if (!foundA) throw new Error('Created item not found in gallery');
  console.log('  ✓ Creation found in User A gallery');

  // Update title & toggle bookmark
  const updateRes = await axios.patch(
    `${BASE}/api/creations/${creationA.id}`,
    { title: 'Porcelain Masterpiece', saved: true },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  if (updateRes.data.creation.title !== 'Porcelain Masterpiece' || !updateRes.data.creation.saved) {
    throw new Error('Gallery update failed');
  }
  console.log('  ✓ Gallery PATCH (title & bookmark save) verified\n');

  // 5. Database Persistence
  console.log('5. Database Persistence...');
  const verifyPersisted = await axios.get(`${BASE}/api/creations`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const persistedItem = verifyPersisted.data.creations?.find((c: any) => c.id === creationA.id);
  if (persistedItem.title !== 'Porcelain Masterpiece' || !persistedItem.saved) {
    throw new Error('Persistence verification failed');
  }
  console.log('  ✓ Updated creation state persists in database repository\n');

  // 6. User Privacy & Scoping
  console.log('6. User Privacy & Multi-Tenant Scoping...');
  const galleryB = await axios.get(`${BASE}/api/creations`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const leakedToB = galleryB.data.creations?.some((c: any) => c.id === creationA.id);
  if (leakedToB) {
    throw new Error('SECURITY VIOLATION: User A creation visible to User B!');
  }
  console.log('  ✓ User B gallery does NOT contain User A creation (0 creations leaked)');

  // Try modifying User A creation using User B token
  const illegalPatch = await axios.patch(
    `${BASE}/api/creations/${creationA.id}`,
    { title: 'Hacked Title' },
    { headers: { Authorization: `Bearer ${tokenB}` }, validateStatus: () => true }
  );
  if (illegalPatch.status !== 404 && illegalPatch.status !== 403) {
    throw new Error(`SECURITY VIOLATION: User B modified User A creation! (Status: ${illegalPatch.status})`);
  }
  console.log(`  ✓ User B unauthorized modification rejected with HTTP ${illegalPatch.status}\n`);

  // 7. Error Handling & Validation
  console.log('7. Error Handling & Input Validation...');
  const emptyPrompt = await axios.post(
    `${BASE}/api/generate`,
    { prompt: '   ' },
    { headers: { Authorization: `Bearer ${tokenA}` }, validateStatus: () => true }
  );
  if (emptyPrompt.status !== 400) throw new Error('Empty prompt validation failed');
  console.log('  ✓ Empty prompt rejected with HTTP 400 Bad Request');

  const unauth = await axios.get(`${BASE}/api/creations`, { validateStatus: () => true });
  if (unauth.status !== 401) throw new Error('Unauthenticated access not blocked');
  console.log('  ✓ Missing token rejected with HTTP 401 Unauthorized\n');

  console.log('======================================================');
  console.log('  🎉 ALL 7 REGRESSION TEST SUITES PASSED CLEANLY');
  console.log('======================================================\n');
}

runRegression().catch((err) => {
  console.error('\n❌ Regression Test Suite Failed:', err.response?.data || err.message);
  process.exit(1);
});

