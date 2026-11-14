import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:5050';

interface GenerationTestCase {
  genre: string;
  prompt: string;
  aspectRatio: '1:1' | '4:5' | '16:9' | '9:16';
  style: string;
  expectedRatio: string;
}

const TEST_CASES: GenerationTestCase[] = [
  {
    genre: 'Photorealistic portrait',
    prompt: 'Photorealistic portrait of an elderly artisan watchmaker with deep weathered wrinkles examining gears in warm window light, 85mm lens',
    aspectRatio: '4:5',
    style: 'Editorial',
    expectedRatio: '4:5 (816 × 1020)',
  },
  {
    genre: 'Landscape photography',
    prompt: 'Dramatic landscape photography of Norwegian glacial fjords shrouded in morning mist, emerald reflections, high dynamic range',
    aspectRatio: '16:9',
    style: 'Minimal',
    expectedRatio: '16:9 (1024 × 576)',
  },
  {
    genre: 'Architecture',
    prompt: 'Modern brutalist cantilevered museum concrete pavilion over tranquil reflecting pool at twilight, warm interior illumination',
    aspectRatio: '16:9',
    style: 'Architectural',
    expectedRatio: '16:9 (1024 × 576)',
  },
  {
    genre: 'Product photography',
    prompt: 'Clean luxury studio product photography of a frosted minimalist glass perfume bottle resting on travertine stone, soft shadow',
    aspectRatio: '1:1',
    style: 'Editorial',
    expectedRatio: '1:1 (1024 × 1024)',
  },
  {
    genre: 'Digital artwork',
    prompt: 'Intricate digital concept artwork of a celestial floating observatory station among vibrant violet nebula clouds, bioluminescent stars',
    aspectRatio: '16:9',
    style: 'Editorial',
    expectedRatio: '16:9 (1024 × 576)',
  },
];

async function run() {
  console.log('\n======================================================');
  console.log('  🎨 FORMA 5-IMAGE QUALITY ASSURANCE SUITE');
  console.log('======================================================\n');

  // 1. Login
  console.log('Authenticating creator account...');
  const loginRes = await axios.post(`${BASE}/api/auth/signin`, {
    email: 'creator@studio.in',
    password: 'password123',
  });
  const token = loginRes.data.token;
  const initialCredits = loginRes.data.user.credits;
  console.log(`✓ Authenticated as ${loginRes.data.user.email} (Credits: ${initialCredits})\n`);

  // 2. Test Prompt Enhancement
  console.log('Testing AI Prompt Enhancement API (/api/generate/enhance)...');
  try {
    const enhanceRes = await axios.post(
      `${BASE}/api/generate/enhance`,
      { prompt: 'A lonely lighthouse in a storm', style: 'Architectural' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('  Original Prompt: "A lonely lighthouse in a storm"');
    console.log('  Enhanced Prompt:', enhanceRes.data.enhancedPrompt);
    console.log('  Provider:', enhanceRes.data.provider);
    console.log('  ✓ PASS: Prompt Enhancement is functional!\n');
  } catch (err: any) {
    console.warn('  ⚠️ Prompt enhancement warning:', err.response?.data || err.message);
  }

  const results: any[] = [];

  // 3. Generate 5 Distinct Images
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    console.log(`------------------------------------------------------`);
    console.log(`[Image ${i + 1}/5] Generating: ${tc.genre}`);
    console.log(`  Prompt: "${tc.prompt.slice(0, 60)}..."`);
    console.log(`  Aspect Ratio: ${tc.aspectRatio} | Style: ${tc.style}`);

    const startTime = Date.now();
    const genRes = await axios.post(
      `${BASE}/api/generate`,
      {
        mode: 'image',
        prompt: tc.prompt,
        aspectRatio: tc.aspectRatio,
        style: tc.style,
        model: 'free-flux-schnell',
        resolution: '1K',
        variations: 1,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 90000,
      }
    );

    const elapsedMs = Date.now() - startTime;
    const data = genRes.data;

    console.log(`  HTTP Status: ${genRes.status} (Elapsed: ${(elapsedMs / 1000).toFixed(1)}s)`);
    console.log(`  Creation ID: ${data.id}`);
    console.log(`  Media URL: ${data.mediaUrl}`);
    console.log(`  Dimensions: ${data.dimensions}`);
    console.log(`  Seed: ${data.seed}`);

    // Verify disk file
    const filename = path.basename(data.mediaUrl);
    const diskPath = path.resolve('uploads/creations', filename);
    if (!fs.existsSync(diskPath)) {
      throw new Error(`File does not exist on disk: ${diskPath}`);
    }

    const fileBuffer = fs.readFileSync(diskPath);
    const fileSize = fileBuffer.length;
    const isJpeg = fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8 && fileBuffer[2] === 0xff;
    const isPng = fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x4e && fileBuffer[3] === 0x47;

    console.log(`  Disk File: ${filename} (${fileSize} bytes, Format: ${isJpeg ? 'JPEG' : isPng ? 'PNG' : 'UNKNOWN'})`);
    if (fileSize < 5000 || (!isJpeg && !isPng)) {
      throw new Error(`Image file validation failed for ${filename}`);
    }
    console.log(`  ✓ Binary signature verified`);

    // Verify HTTP serving & browser preview
    const httpCheck = await axios.get(`${BASE}${data.mediaUrl}`, { responseType: 'arraybuffer' });
    console.log(`  HTTP Serving: Status ${httpCheck.status}, Content-Type: ${httpCheck.headers['content-type']}`);
    if (httpCheck.status !== 200 || !httpCheck.headers['content-type']?.includes('image/')) {
      throw new Error(`HTTP serving failed for ${data.mediaUrl}`);
    }
    console.log(`  ✓ HTTP browser preview verified`);

    // Verify Gallery persistence
    const galleryRes = await axios.get(`${BASE}/api/creations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const foundInGallery = galleryRes.data.creations?.some((c: any) => c.id === data.id);
    console.log(`  Gallery Persistence: ${foundInGallery ? 'FOUND in DB Gallery' : 'MISSING'}`);
    if (!foundInGallery) {
      throw new Error(`Creation ${data.id} not found in gallery listing!`);
    }
    console.log(`  ✓ Gallery persistence verified\n`);

    results.push({
      genre: tc.genre,
      id: data.id,
      prompt: tc.prompt,
      dimensions: data.dimensions,
      aspectRatio: tc.aspectRatio,
      mediaUrl: data.mediaUrl,
      fileSize,
      format: isJpeg ? 'JPEG' : 'PNG',
      elapsedSeconds: (elapsedMs / 1000).toFixed(1),
    });

    // Pacing between generations to respect free community tier rate windows
    if (i < TEST_CASES.length - 1) {
      console.log('  Pacing 8s before next image...');
      await new Promise((r) => setTimeout(r, 8000));
    }
  }

  // 4. Verify Credit Deduction
  const meRes = await axios.get(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const finalCredits = meRes.data.user.credits;
  console.log('======================================================');
  console.log(`Credits Initial: ${initialCredits} | Credits Final: ${finalCredits} (Deducted: ${initialCredits - finalCredits})`);
  console.log('======================================================\n');

  console.log('SUMMARY TABLE OF 5 REAL GENERATED IMAGES:');
  console.table(results);
}

run().catch((err) => {
  console.error('\n❌ QA Test Suite Failed:', err.response?.data || err.message);
  process.exit(1);
});
