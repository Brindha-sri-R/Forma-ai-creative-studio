import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:5050';

const PROMPT_ENHANCE_INPUTS = [
  'A girl walking in rain.',
  'A futuristic city.',
  'A luxury perfume bottle.',
  'A beautiful mountain landscape.',
  'A cat sitting near a window.',
];

interface GenreTestCase {
  genre: string;
  prompt: string;
  aspectRatio: '1:1' | '4:5' | '16:9' | '9:16';
  style: string;
}

const GENRE_TEST_CASES: GenreTestCase[] = [
  {
    genre: 'Photorealistic portrait',
    prompt: 'Photorealistic close-up portrait of an elderly sea captain with a silver beard and intense weathered eyes, soft nautical morning light, 85mm portrait lens',
    aspectRatio: '4:5',
    style: 'Editorial',
  },
  {
    genre: 'Landscape photography',
    prompt: 'Majestic aerial landscape photography of the Scottish Highlands with sun rays piercing through dramatic storm clouds over dark loch waters',
    aspectRatio: '16:9',
    style: 'Minimal',
  },
  {
    genre: 'Architecture',
    prompt: 'Contemporary parametric glass and curved timber pavilion standing in a public plaza in Copenhagen, twilight reflections, architectural digest style',
    aspectRatio: '16:9',
    style: 'Architectural',
  },
  {
    genre: 'Product photography',
    prompt: 'High-end commercial product photography of an artisanal matte black ceramic teapot on raw textured marble, single softbox studio lighting',
    aspectRatio: '1:1',
    style: 'Minimal',
  },
  {
    genre: 'Digital artwork',
    prompt: 'Ethereal digital artwork of a mythical crystal stag standing in a glowing bioluminescent enchanted forest, vibrant dreamlike colors, concept art',
    aspectRatio: '16:9',
    style: 'Editorial',
  },
  {
    genre: 'Anime illustration',
    prompt: 'Vibrant anime illustration of a mecha pilot standing on a launch catapult overlooking a sprawling neon cyber metropolis at dawn, detailed lineart, Makoto Shinkai aesthetic',
    aspectRatio: '16:9',
    style: 'Editorial',
  },
  {
    genre: 'Fashion photography',
    prompt: 'High-fashion editorial photography of an avant-garde model in a pleated crimson silk gown on a windswept volcanic black sand beach, dramatic contrast',
    aspectRatio: '4:5',
    style: 'Editorial',
  },
  {
    genre: 'Food photography',
    prompt: 'Artisanal gourmet food photography of a freshly baked rustic sourdough bread loaf on wooden cutting board with scattered flour and rosemary sprigs, warm natural kitchen light',
    aspectRatio: '1:1',
    style: 'Editorial',
  },
  {
    genre: 'Interior design',
    prompt: 'Sunlit Japandi living room interior design with low minimalist oak furniture, linen cushions, indoor olive tree in clay pot, soft neutral earth tones, architectural digest',
    aspectRatio: '16:9',
    style: 'Minimal',
  },
  {
    genre: 'Sci-fi concept art',
    prompt: 'Cinematic sci-fi concept art of an orbital cargo transport ship docking with an enormous planetary ring space station, planet Earth below in starry cosmos, epic scale',
    aspectRatio: '16:9',
    style: 'Architectural',
  },
];

async function runValidation() {
  console.log('\n================================================================');
  console.log('  🔍 FORMA IMAGE STUDIO QA & PROMPT ENHANCEMENT VALIDATION');
  console.log('================================================================\n');

  // Authenticate
  const loginRes = await axios.post(`${BASE}/api/auth/signin`, {
    email: 'creator@studio.in',
    password: 'password123',
  });
  const token = loginRes.data.token;
  let currentCredits = loginRes.data.user.credits;
  if (currentCredits < 15) {
    try {
      await axios.post(`${BASE}/api/credits/plan`, { planId: 'free' }, { headers: { Authorization: `Bearer ${token}` } });
      currentCredits = 25;
    } catch {}
  }
  console.log(`✓ Authenticated as ${loginRes.data.user.email} (Starting Balance: ${currentCredits} credits)\n`);

  // SECTION 1: PROMPT ENHANCEMENT VALIDATION
  console.log('================================================================');
  console.log('  PART 1: PROMPT ENHANCEMENT VALIDATION (5 REQUIRED INPUTS)');
  console.log('================================================================\n');

  const enhancementResults: any[] = [];

  for (let i = 0; i < PROMPT_ENHANCE_INPUTS.length; i++) {
    const input = PROMPT_ENHANCE_INPUTS[i];
    console.log(`[Prompt ${i + 1}/5] Input: "${input}"`);

    const res = await axios.post(
      `${BASE}/api/generate/enhance`,
      { prompt: input },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const enhanced = res.data.enhancedPrompt;
    const provider = res.data.provider;

    console.log(`  Enhanced (${provider}):`);
    console.log(`  "${enhanced}"`);

    // Validation checks
    const hasLength = enhanced.length > input.length * 2;
    const preservesSubject = (
      (i === 0 && (enhanced.toLowerCase().includes('girl') || enhanced.toLowerCase().includes('woman') || enhanced.toLowerCase().includes('rain'))) ||
      (i === 1 && (enhanced.toLowerCase().includes('city') || enhanced.toLowerCase().includes('urban') || enhanced.toLowerCase().includes('futuristic'))) ||
      (i === 2 && (enhanced.toLowerCase().includes('perfume') || enhanced.toLowerCase().includes('bottle') || enhanced.toLowerCase().includes('glass'))) ||
      (i === 3 && (enhanced.toLowerCase().includes('mountain') || enhanced.toLowerCase().includes('landscape') || enhanced.toLowerCase().includes('peak'))) ||
      (i === 4 && (enhanced.toLowerCase().includes('cat') || enhanced.toLowerCase().includes('feline') || enhanced.toLowerCase().includes('window')))
    );

    console.log(`  ✓ Meaningful detail added: ${hasLength ? 'YES' : 'NO'}`);
    console.log(`  ✓ Core subject preserved: ${preservesSubject ? 'YES' : 'NO'}\n`);

    enhancementResults.push({
      input,
      enhanced,
      provider,
      preservesSubject,
    });
  }

  // Edge case: empty input validation
  try {
    await axios.post(
      `${BASE}/api/generate/enhance`,
      { prompt: '   ' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    throw new Error('Empty prompt was not rejected');
  } catch (err: any) {
    if (err.response?.status === 400) {
      console.log('✓ Edge case: Empty prompt rejected with HTTP 400 Bad Request as expected\n');
    } else {
      throw err;
    }
  }

  // SECTION 2: 10 IMAGE GENERATION TESTS ACROSS GENRES
  console.log('================================================================');
  console.log('  PART 2: 10 IMAGE GENERATION TESTS ACROSS GENRES');
  console.log('================================================================\n');

  const generationResults: any[] = [];
  let successfulGenerations = 0;
  let failedGenerations = 0;

  for (let i = 0; i < GENRE_TEST_CASES.length; i++) {
    const tc = GENRE_TEST_CASES[i];
    console.log(`----------------------------------------------------------------`);
    console.log(`[Genre ${i + 1}/10] ${tc.genre}`);
    console.log(`  Prompt: "${tc.prompt.slice(0, 65)}..."`);
    console.log(`  Ratio: ${tc.aspectRatio} | Style: ${tc.style}`);

    // Generate fresh unique seed to ensure non-cached result
    const uniqueSeed = Math.floor(100000 + Math.random() * 899999);
    const startCredits = currentCredits;
    const startTime = Date.now();

    try {
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
          seed: uniqueSeed,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 90000,
        }
      );

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const data = genRes.data;

      // 1. Verify response properties
      if (genRes.status !== 201 || !data.mediaUrl) {
        throw new Error(`Generation failed with status ${genRes.status}`);
      }

      // 2. Verify disk binary file
      const filename = path.basename(data.mediaUrl);
      const diskPath = path.resolve('uploads/creations', filename);
      if (!fs.existsSync(diskPath)) {
        throw new Error(`Disk file missing: ${diskPath}`);
      }
      const buf = fs.readFileSync(diskPath);
      const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
      const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;

      if (!isJpeg && !isPng) {
        throw new Error(`Invalid binary signature for ${filename}`);
      }

      // 3. Verify HTTP static serving (browser preview)
      const previewRes = await axios.get(`${BASE}${data.mediaUrl}`, { responseType: 'arraybuffer' });
      if (previewRes.status !== 200 || !previewRes.headers['content-type']?.includes('image/')) {
        throw new Error(`Preview failed for ${data.mediaUrl}`);
      }

      // 4. Verify gallery persistence
      const galleryRes = await axios.get(`${BASE}/api/creations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const inGallery = galleryRes.data.creations?.some((c: any) => c.id === data.id);
      if (!inGallery) {
        throw new Error(`Creation ${data.id} missing from user gallery`);
      }

      // 5. Verify Credit Deduction
      const meRes = await axios.get(`${BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      currentCredits = meRes.data.user.credits;
      const deducted = startCredits - currentCredits;
      if (deducted !== 1) {
        throw new Error(`Expected exactly 1 credit deducted, but got ${deducted}`);
      }

      console.log(`  ✓ Generated in ${elapsed}s (ID: ${data.id})`);
      console.log(`  ✓ Dimensions: ${data.dimensions} (Seed: ${data.seed})`);
      console.log(`  ✓ Binary Validated: ${buf.length} bytes ${isJpeg ? 'JPEG' : 'PNG'}`);
      console.log(`  ✓ Browser Preview: HTTP 200 OK (${previewRes.headers['content-type']})`);
      console.log(`  ✓ User Gallery: Confirmed Stored`);
      console.log(`  ✓ Credits: ${startCredits} -> ${currentCredits} (Deducted: 1 credit)\n`);

      successfulGenerations++;
      generationResults.push({
        genre: tc.genre,
        id: data.id,
        dimensions: data.dimensions,
        aspectRatio: tc.aspectRatio,
        fileSize: `${(buf.length / 1024).toFixed(1)} KB`,
        format: isJpeg ? 'JPEG' : 'PNG',
        mediaUrl: data.mediaUrl,
        elapsedSeconds: `${elapsed}s`,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      failedGenerations++;
      console.error(`  ❌ Generation failed for ${tc.genre}:`, err.response?.data?.error || err.message);
      generationResults.push({
        genre: tc.genre,
        id: 'N/A',
        dimensions: 'N/A',
        aspectRatio: tc.aspectRatio,
        fileSize: '0',
        format: 'NONE',
        mediaUrl: 'N/A',
        elapsedSeconds: 'N/A',
        status: 'FAILED',
      });
    }

    // Pacing between generations to respect community node rate windows
    if (i < GENRE_TEST_CASES.length - 1) {
      console.log('  Pacing 8s before next genre...');
      await new Promise((r) => setTimeout(r, 8000));
    }
  }

  console.log('================================================================');
  console.log(`RESULTS SUMMARY: ${successfulGenerations}/10 Generations Succeeded (${failedGenerations} Failed)`);
  console.log('================================================================\n');

  console.log('10 GENRES GENERATION RESULTS TABLE:');
  console.table(generationResults);

  return {
    enhancementResults,
    generationResults,
    successfulGenerations,
    failedGenerations,
  };
}

runValidation().catch((err) => {
  console.error('\n❌ QA Validation Run Failed:', err);
  process.exit(1);
});
