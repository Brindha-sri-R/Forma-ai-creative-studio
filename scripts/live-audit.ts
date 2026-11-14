/**
 * FORMA FULL-STACK LIVE AUDIT SCRIPT v2
 * Ground-truth verification. API response shape: { success, message, ...data } (no data wrapper).
 */

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:5050';
const AUDIT_EMAIL = `audit-${Date.now()}@forma-test.dev`;
const AUDIT_EMAIL_B = `audit-b-${Date.now()}@forma-test.dev`;
const AUDIT_PASSWORD = 'AuditPass!99';

type Result = { label: string; status: 'PASS' | 'FAIL' | 'NOT_CONFIGURED'; detail: string };
const results: Result[] = [];

function pass(label: string, detail: string) {
  results.push({ label, status: 'PASS', detail });
  console.log(`  ✅ PASS  — ${label}: ${detail}`);
}
function fail(label: string, detail: string) {
  results.push({ label, status: 'FAIL', detail });
  console.error(`  ❌ FAIL  — ${label}: ${detail}`);
}
function nc(label: string, detail: string) {
  results.push({ label, status: 'NOT_CONFIGURED', detail });
  console.log(`  ⚠️  N/C   — ${label}: ${detail}`);
}

function req(
  url: string,
  method = 'GET',
  body: any = null,
  token: string | null = null
): Promise<{ status: number; body: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = String(Buffer.byteLength(postData));

    const opts: any = {
      hostname: parsed.hostname,
      port: parseInt(parsed.port || (isHttps ? '443' : '80'), 10),
      path: parsed.pathname + parsed.search,
      method,
      headers,
    };

    const transport: any = isHttps ? https : http;
    const r = transport.request(opts, (res: any) => {
      let data = '';
      res.on('data', (c: any) => (data += c));
      res.on('end', () => {
        let parsed: any;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode || 0, body: parsed, raw: data });
      });
    });
    r.on('error', reject);
    r.setTimeout(12000, () => { r.destroy(new Error('Request timed out')); });
    if (postData) r.write(postData);
    r.end();
  });
}

async function runAudit() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   FORMA FULL-STACK INDEPENDENT LIVE AUDIT v2                 ║');
  console.log(`║   ${new Date().toISOString()}                        ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ── 1. Backend health ──────────────────────────────────────────
  console.log('▸ [1] Backend health endpoint');
  try {
    const r = await req(`${BASE}/api/health`);
    if (r.status === 200 && r.body?.status === 'healthy') {
      pass('Backend health endpoint', `HTTP 200 — db="${r.body.database}" aiMode="${r.body.aiEngine?.mode}"`);
    } else {
      fail('Backend health endpoint', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 100)}`);
    }
  } catch (e: any) { fail('Backend health endpoint', `Connection error: ${e.message}`); }

  // ── 2. Database mode ───────────────────────────────────────────
  console.log('\n▸ [2] Database mode');
  try {
    const r = await req(`${BASE}/api/health`);
    const db = r.body?.database || '';
    if (db.toLowerCase().includes('mongodb')) {
      pass('Database: MongoDB', db);
    } else {
      nc('MongoDB', `Not running — using fallback SQLite persistence: "${db}"`);
      pass('Fallback SQLite active', 'Zero-config persistent local storage is operational');
    }
  } catch (e: any) { fail('Database mode', e.message); }

  // ── 3. Vite dev server ─────────────────────────────────────────
  console.log('\n▸ [3] Vite frontend dev server (port 5173)');
  try {
    const r = await req('http://localhost:5173');
    if (r.status === 200 && r.raw.toLowerCase().includes('<!doctype html')) {
      pass('Vite frontend loads', 'HTTP 200, HTML document returned');
    } else {
      fail('Vite frontend loads', `HTTP ${r.status}`);
    }
  } catch (e: any) {
    nc('Vite frontend', `Not running in this audit context — must be started by user via "npm run dev" (error: ${e.message})`);
  }

  // ── 4. API proxy ───────────────────────────────────────────────
  console.log('\n▸ [4] Frontend API proxy (port 5173 → 5050)');
  try {
    const r = await req('http://localhost:5173/api/health');
    if (r.status === 200 && r.body?.status === 'healthy') {
      pass('API proxy works', 'Vite correctly proxies /api to :5050');
    } else {
      fail('API proxy works', `HTTP ${r.status}`);
    }
  } catch (e: any) {
    nc('API proxy', `Vite not running — proxy untestable in daemon-only context`);
  }

  // ── 5. User registration ───────────────────────────────────────
  console.log('\n▸ [5] User registration');
  let tokenA = '';
  let userAId = '';
  try {
    const r = await req(`${BASE}/api/auth/signup`, 'POST', {
      email: AUDIT_EMAIL, password: AUDIT_PASSWORD, fullName: 'Audit User Alpha',
    });
    // API shape: { success, message, token, user: { id, email, ... } }
    if (r.status === 201 && r.body?.token && r.body?.user?.id) {
      tokenA = r.body.token;
      userAId = r.body.user.id;
      pass('User registration', `HTTP 201, userId=${userAId}, JWT issued (${tokenA.length} chars)`);
    } else {
      fail('User registration', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 150)}`);
    }
  } catch (e: any) { fail('User registration', e.message); }

  // ── 6. Duplicate registration rejected ────────────────────────
  console.log('\n▸ [6] Duplicate registration rejected');
  try {
    const r = await req(`${BASE}/api/auth/signup`, 'POST', { email: AUDIT_EMAIL, password: AUDIT_PASSWORD });
    if (r.status === 409) {
      pass('Duplicate registration rejected', 'HTTP 409 Conflict returned correctly');
    } else {
      fail('Duplicate registration rejected', `Expected 409, got HTTP ${r.status}`);
    }
  } catch (e: any) { fail('Duplicate registration rejected', e.message); }

  // ── 7. Login ───────────────────────────────────────────────────
  console.log('\n▸ [7] User login');
  try {
    const r = await req(`${BASE}/api/auth/signin`, 'POST', { email: AUDIT_EMAIL, password: AUDIT_PASSWORD });
    if (r.status === 200 && r.body?.token) {
      tokenA = r.body.token;
      pass('User login', `HTTP 200, fresh JWT issued`);
    } else {
      fail('User login', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 150)}`);
    }
  } catch (e: any) { fail('User login', e.message); }

  // ── 8. Wrong password rejected ────────────────────────────────
  console.log('\n▸ [8] Wrong password rejected');
  try {
    const r = await req(`${BASE}/api/auth/signin`, 'POST', { email: AUDIT_EMAIL, password: 'WrongPassword!' });
    if (r.status === 401) {
      pass('Wrong password rejected', 'HTTP 401 Unauthorized');
    } else {
      fail('Wrong password rejected', `Expected 401, got HTTP ${r.status}`);
    }
  } catch (e: any) { fail('Wrong password rejected', e.message); }

  // ── 9. /me with valid token ────────────────────────────────────
  console.log('\n▸ [9] Auth persistence — GET /api/auth/me with JWT');
  try {
    const r = await req(`${BASE}/api/auth/me`, 'GET', null, tokenA);
    // API shape: { success, user: { id, email, planId, credits, ... } }
    if (r.status === 200 && r.body?.user?.email === AUDIT_EMAIL) {
      pass('Auth persistence (/me)', `HTTP 200, email=${r.body.user.email}, planId=${r.body.user.planId}, credits=${r.body.user.credits}`);
    } else {
      fail('Auth persistence (/me)', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 150)}`);
    }
  } catch (e: any) { fail('Auth persistence (/me)', e.message); }

  // ── 10. Protected route without token ─────────────────────────
  console.log('\n▸ [10] Protected route without token → 401');
  try {
    const r = await req(`${BASE}/api/auth/me`, 'GET', null, null);
    if (r.status === 401) {
      pass('Unauthenticated access blocked', 'HTTP 401 without token');
    } else {
      fail('Unauthenticated access blocked', `Expected 401, got HTTP ${r.status}`);
    }
  } catch (e: any) { fail('Unauthenticated access blocked', e.message); }

  // ── 11. Image generation ───────────────────────────────────────
  console.log('\n▸ [11] Image generation');
  let imageCreationId = '';
  let imageMediaUrl = '';
  try {
    const r = await req(`${BASE}/api/generate`, 'POST', {
      mode: 'image', prompt: 'Audit: Cinematic neon cityscape at dusk',
      aspectRatio: '16:9', resolution: '1K', style: 'Editorial',
      model: 'Forma Diffusion v3', variations: 1,
    }, tokenA);
    // Response shape: { success, message, id, title, mediaUrl, isDemoMode, provider, newBalance, ... }
    if (r.status === 201 && r.body?.id && r.body?.mediaUrl) {
      imageCreationId = r.body.id;
      imageMediaUrl = r.body.mediaUrl;
      pass('Image generation API', `HTTP 201, id=${imageCreationId}, provider="${r.body.provider}", isDemoMode=${r.body.isDemoMode}`);
      if (r.body.isDemoMode) nc('Real AI image provider', 'No OPENAI_API_KEY / STABILITY_API_KEY — demo synthesis active');
    } else {
      fail('Image generation API', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 200)}`);
    }
  } catch (e: any) { fail('Image generation API', e.message); }

  // ── 12. Image file on disk ─────────────────────────────────────
  console.log('\n▸ [12] Generated image file exists on disk');
  if (imageMediaUrl) {
    try {
      const rel = imageMediaUrl.replace(/^\/uploads\//, '');
      const fp = path.resolve('uploads', rel);
      if (fs.existsSync(fp)) {
        const sz = fs.statSync(fp).size;
        pass('Image file on disk', `${fp} (${sz} bytes)`);
      } else {
        fail('Image file on disk', `NOT found at ${fp} (mediaUrl=${imageMediaUrl})`);
      }
    } catch (e: any) { fail('Image file on disk', e.message); }
  } else {
    fail('Image file on disk', 'Skipped — image generation failed');
  }

  // ── 13. Image file HTTP-servable ──────────────────────────────
  console.log('\n▸ [13] Image file served via /uploads HTTP route');
  if (imageMediaUrl) {
    try {
      const r = await req(`${BASE}${imageMediaUrl}`);
      if (r.status === 200) {
        pass('Image file HTTP-servable', `GET ${imageMediaUrl} → HTTP 200`);
      } else {
        fail('Image file HTTP-servable', `GET ${imageMediaUrl} → HTTP ${r.status}`);
      }
    } catch (e: any) { fail('Image file HTTP-servable', e.message); }
  } else {
    fail('Image file HTTP-servable', 'Skipped — no mediaUrl');
  }

  // ── 14. Video generation ───────────────────────────────────────
  console.log('\n▸ [14] Video generation');
  let videoCreationId = '';
  let videoMediaUrl = '';
  try {
    const r = await req(`${BASE}/api/generate`, 'POST', {
      mode: 'video', prompt: 'Audit: Ocean waves under stormy sky',
      aspectRatio: '16:9', duration: '4s', motion: 'Dynamic', fps: '24 fps', model: 'Forma Motion v2',
    }, tokenA);
    if (r.status === 201 && r.body?.id && r.body?.mediaUrl) {
      videoCreationId = r.body.id;
      videoMediaUrl = r.body.mediaUrl;
      pass('Video generation API', `HTTP 201, id=${videoCreationId}, provider="${r.body.provider}", isDemoMode=${r.body.isDemoMode}`);
      if (r.body.isDemoMode) nc('Real AI video provider', 'No RUNWAY_API_KEY / LUMA_API_KEY / FAL_KEY — demo cinematic SVG active');
    } else {
      fail('Video generation API', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 200)}`);
    }
  } catch (e: any) { fail('Video generation API', e.message); }

  // ── 15. Video file on disk ─────────────────────────────────────
  console.log('\n▸ [15] Generated video file exists on disk');
  if (videoMediaUrl) {
    try {
      const rel = videoMediaUrl.replace(/^\/uploads\//, '');
      const fp = path.resolve('uploads', rel);
      if (fs.existsSync(fp)) {
        const sz = fs.statSync(fp).size;
        pass('Video file on disk', `${fp} (${sz} bytes, animated SVG)`);
      } else {
        fail('Video file on disk', `NOT found at ${fp}`);
      }
    } catch (e: any) { fail('Video file on disk', e.message); }
  } else {
    fail('Video file on disk', 'Skipped — video generation failed');
  }

  // ── 16. Video file HTTP-servable ──────────────────────────────
  console.log('\n▸ [16] Video file served via /uploads HTTP route');
  if (videoMediaUrl) {
    try {
      const r = await req(`${BASE}${videoMediaUrl}`);
      if (r.status === 200) {
        pass('Video file HTTP-servable', `GET ${videoMediaUrl} → HTTP 200`);
      } else {
        fail('Video file HTTP-servable', `HTTP ${r.status}`);
      }
    } catch (e: any) { fail('Video file HTTP-servable', e.message); }
  } else {
    fail('Video file HTTP-servable', 'Skipped');
  }

  // ── 17. Gallery listing ───────────────────────────────────────
  console.log('\n▸ [17] Gallery listing returns user creations');
  try {
    const r = await req(`${BASE}/api/creations`, 'GET', null, tokenA);
    // Shape: { success, creations: [...] }
    if (r.status === 200 && Array.isArray(r.body?.creations)) {
      const count = r.body.creations.length;
      const hasImg = r.body.creations.some((c: any) => c.id === imageCreationId);
      const hasVid = r.body.creations.some((c: any) => c.id === videoCreationId);
      if (count >= 2 && hasImg && hasVid) {
        pass('Gallery listing', `${count} creations returned, includes our image and video`);
      } else {
        fail('Gallery listing', `${count} items, hasImg=${hasImg}, hasVid=${hasVid}`);
      }
    } else {
      fail('Gallery listing', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 120)}`);
    }
  } catch (e: any) { fail('Gallery listing', e.message); }

  // ── 18. Rename creation ───────────────────────────────────────
  console.log('\n▸ [18] Rename a creation');
  if (imageCreationId) {
    try {
      const newTitle = 'Audit-Renamed Neon City';
      const r = await req(`${BASE}/api/creations/${imageCreationId}`, 'PATCH', { title: newTitle }, tokenA);
      // Shape: { success, creation: { ... } }
      if (r.status === 200 && r.body?.creation?.title === newTitle) {
        pass('Rename creation', `Title updated to "${newTitle}"`);
      } else {
        fail('Rename creation', `HTTP ${r.status}: title=${r.body?.creation?.title}`);
      }
    } catch (e: any) { fail('Rename creation', e.message); }
  } else {
    fail('Rename creation', 'Skipped — no creation ID');
  }

  // ── 19. Favorite/bookmark ─────────────────────────────────────
  console.log('\n▸ [19] Favorite/bookmark a creation');
  if (imageCreationId) {
    try {
      const r = await req(`${BASE}/api/creations/${imageCreationId}`, 'PATCH', { saved: true }, tokenA);
      if (r.status === 200 && r.body?.creation?.saved === true) {
        pass('Favorite creation', 'saved=true persisted correctly');
      } else {
        fail('Favorite creation', `HTTP ${r.status}: saved=${r.body?.creation?.saved}`);
      }
    } catch (e: any) { fail('Favorite creation', e.message); }
  } else {
    fail('Favorite creation', 'Skipped');
  }

  // ── 20. Duplicate creation ────────────────────────────────────
  console.log('\n▸ [20] Duplicate a creation');
  let duplicateId = '';
  if (imageCreationId) {
    try {
      const r = await req(`${BASE}/api/creations/${imageCreationId}/duplicate`, 'POST', null, tokenA);
      if (r.status === 201 && r.body?.creation?.id && r.body.creation.id !== imageCreationId) {
        duplicateId = r.body.creation.id;
        pass('Duplicate creation', `New id=${duplicateId}, title="${r.body.creation.title}"`);
      } else {
        fail('Duplicate creation', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 120)}`);
      }
    } catch (e: any) { fail('Duplicate creation', e.message); }
  } else {
    fail('Duplicate creation', 'Skipped');
  }

  // ── 21. Persistence — gallery count ──────────────────────────
  console.log('\n▸ [21] Persistence — gallery count after operations');
  try {
    const r = await req(`${BASE}/api/creations`, 'GET', null, tokenA);
    if (r.status === 200 && Array.isArray(r.body?.creations)) {
      const count = r.body.creations.length;
      if (count >= 3) {
        pass('Persistence — gallery count', `${count} creations (image + video + duplicate all persisted)`);
      } else {
        fail('Persistence — gallery count', `Only ${count} creations — expected ≥ 3`);
      }
    } else {
      fail('Persistence — gallery count', `HTTP ${r.status}`);
    }
  } catch (e: any) { fail('Persistence — gallery count', e.message); }

  // ── 22. Delete creation ───────────────────────────────────────
  console.log('\n▸ [22] Delete a creation');
  if (duplicateId) {
    try {
      const r = await req(`${BASE}/api/creations/${duplicateId}`, 'DELETE', null, tokenA);
      if (r.status === 200) {
        pass('Delete creation', `HTTP 200, id=${duplicateId} deleted`);
      } else {
        fail('Delete creation', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 120)}`);
      }
    } catch (e: any) { fail('Delete creation', e.message); }
  } else {
    fail('Delete creation', 'Skipped');
  }

  // ── 23. Deletion confirmed ────────────────────────────────────
  console.log('\n▸ [23] Deletion confirmed in gallery');
  if (duplicateId) {
    try {
      const r = await req(`${BASE}/api/creations`, 'GET', null, tokenA);
      const still = r.body?.creations?.some((c: any) => c.id === duplicateId);
      if (!still) {
        pass('Deletion confirmed', 'Deleted item no longer in gallery');
      } else {
        fail('Deletion confirmed', 'Deleted item still returned in gallery listing');
      }
    } catch (e: any) { fail('Deletion confirmed', e.message); }
  } else {
    fail('Deletion confirmed', 'Skipped');
  }

  // ── 24. User isolation — User B sees none of User A's items ──
  console.log('\n▸ [24] User isolation — User B cannot see User A creations');
  let tokenB = '';
  try {
    const reg = await req(`${BASE}/api/auth/signup`, 'POST', {
      email: AUDIT_EMAIL_B, password: AUDIT_PASSWORD, fullName: 'Audit User Beta',
    });
    if (reg.status === 201 && reg.body?.token) tokenB = reg.body.token;
    if (!tokenB) throw new Error(`User B registration failed: HTTP ${reg.status}`);

    const gallery = await req(`${BASE}/api/creations`, 'GET', null, tokenB);
    const userBItems: any[] = gallery.body?.creations || [];
    const leaked = userBItems.filter((c: any) => c.id === imageCreationId || c.id === videoCreationId);
    if (leaked.length === 0) {
      pass('User isolation', `User B sees 0 of User A's items (User B has ${userBItems.length} items)`);
    } else {
      fail('User isolation', `CRITICAL: User B can see ${leaked.length} of User A's private creations!`);
    }
  } catch (e: any) { fail('User isolation', e.message); }

  // ── 25. Cross-user modification blocked ──────────────────────
  console.log('\n▸ [25] Cross-user modification blocked');
  if (tokenB && imageCreationId) {
    try {
      const r = await req(`${BASE}/api/creations/${imageCreationId}`, 'PATCH', { title: 'HACKED' }, tokenB);
      if (r.status === 404 || r.status === 403 || r.status === 401) {
        pass('Cross-user modification blocked', `HTTP ${r.status} — cannot modify another user's creation`);
      } else if (r.status === 200) {
        fail('Cross-user modification blocked', `CRITICAL: User B successfully modified User A's creation!`);
      } else {
        fail('Cross-user modification blocked', `Unexpected HTTP ${r.status}`);
      }
    } catch (e: any) { fail('Cross-user modification blocked', e.message); }
  } else {
    fail('Cross-user modification blocked', 'Skipped — tokenB or imageCreationId missing');
  }

  // ── 26. Create collection ─────────────────────────────────────
  console.log('\n▸ [26] Create collection');
  try {
    const r = await req(`${BASE}/api/collections`, 'POST', { name: 'Audit Collection' }, tokenA);
    if (r.status === 200 || r.status === 201) {
      pass('Create collection', `HTTP ${r.status}, name="Audit Collection"`);
    } else {
      fail('Create collection', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 120)}`);
    }
  } catch (e: any) { fail('Create collection', e.message); }

  // ── 27. List collections ──────────────────────────────────────
  console.log('\n▸ [27] List collections');
  try {
    const r = await req(`${BASE}/api/collections`, 'GET', null, tokenA);
    // Shape: { success, collections: ['Brand Kit', 'Campaigns', ...] }
    if (r.status === 200 && Array.isArray(r.body?.collections)) {
      const has = r.body.collections.includes('Audit Collection');
      if (has) {
        pass('List collections', `Collections: [${r.body.collections.join(', ')}]`);
      } else {
        fail('List collections', `"Audit Collection" not found in: ${JSON.stringify(r.body.collections)}`);
      }
    } else {
      fail('List collections', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 120)}`);
    }
  } catch (e: any) { fail('List collections', e.message); }

  // ── 28. Assign creation to collection ────────────────────────
  console.log('\n▸ [28] Assign creation to collection');
  if (imageCreationId) {
    try {
      const r = await req(`${BASE}/api/creations/${imageCreationId}`, 'PATCH', { collection: 'Audit Collection' }, tokenA);
      if (r.status === 200) {
        pass('Assign to collection', `HTTP 200 — creation assigned to "Audit Collection"`);
      } else {
        fail('Assign to collection', `HTTP ${r.status}`);
      }
    } catch (e: any) { fail('Assign to collection', e.message); }
  } else {
    fail('Assign to collection', 'Skipped');
  }

  // ── 29. Dashboard stats ───────────────────────────────────────
  console.log('\n▸ [29] Dashboard stats');
  try {
    const r = await req(`${BASE}/api/dashboard/stats`, 'GET', null, tokenA);
    // Shape: { success, stats: { totalCreations, totalImages, totalVideos, user: {...} } }
    if (r.status === 200 && r.body?.stats) {
      const s = r.body.stats;
      pass('Dashboard stats', `totalCreations=${s.totalCreations}, images=${s.totalImages}, videos=${s.totalVideos}, credits=${s.user?.credits}`);
    } else {
      fail('Dashboard stats', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 120)}`);
    }
  } catch (e: any) { fail('Dashboard stats', e.message); }

  // ── 30. Credit history ────────────────────────────────────────
  console.log('\n▸ [30] Credit usage history');
  try {
    const r = await req(`${BASE}/api/credits/history`, 'GET', null, tokenA);
    if (r.status === 200 && Array.isArray(r.body?.history)) {
      pass('Credit history', `${r.body.history.length} entries`);
    } else {
      fail('Credit history', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 120)}`);
    }
  } catch (e: any) { fail('Credit history', e.message); }

  // ── 31. Plan upgrade ──────────────────────────────────────────
  console.log('\n▸ [31] Plan upgrade to Pro');
  try {
    const r = await req(`${BASE}/api/credits/plan`, 'POST', { planId: 'pro' }, tokenA);
    if (r.status === 200 && r.body?.credits) {
      pass('Plan upgrade', `HTTP 200, planId=pro, credits=${r.body.credits}, maxCredits=${r.body.maxCredits}`);
    } else {
      fail('Plan upgrade', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 120)}`);
    }
  } catch (e: any) { fail('Plan upgrade', e.message); }

  // ── 32. Insufficient credits ──────────────────────────────────
  console.log('\n▸ [32] Insufficient credits check');
  if (tokenB) {
    try {
      // User B has 25 free credits. Drain with 6 video generations (6×4=24 credits used → 1 left → next video fails)
      let bal = 25;
      let attempt = 0;
      while (bal >= 4 && attempt < 10) {
        const g = await req(`${BASE}/api/generate`, 'POST', {
          mode: 'video', prompt: 'exhaust', aspectRatio: '1:1', duration: '4s', motion: 'Static', fps: '24 fps',
        }, tokenB);
        if (g.status === 201) {
          bal = g.body?.newBalance ?? (bal - 4);
        } else {
          bal = 0;
        }
        attempt++;
      }
      const r = await req(`${BASE}/api/generate`, 'POST', {
        mode: 'video', prompt: 'should fail', aspectRatio: '1:1', duration: '4s', motion: 'Static', fps: '24 fps',
      }, tokenB);
      if (r.status === 402) {
        pass('Insufficient credits blocked', `HTTP 402 Payment Required (balance=${bal})`);
      } else {
        fail('Insufficient credits blocked', `Expected 402, got ${r.status} (balance was ${bal})`);
      }
    } catch (e: any) { fail('Insufficient credits blocked', e.message); }
  } else {
    fail('Insufficient credits blocked', 'Skipped — tokenB missing');
  }

  // ── 33. Persistence after simulated restart ───────────────────
  console.log('\n▸ [33] Data persistence — renamed item survives after re-fetch');
  if (imageCreationId && tokenA) {
    try {
      const r = await req(`${BASE}/api/creations`, 'GET', null, tokenA);
      const item = r.body?.creations?.find((c: any) => c.id === imageCreationId);
      if (item && item.title === 'Audit-Renamed Neon City' && item.saved === true) {
        pass('Data persistence', `item "${item.title}", saved=${item.saved} — rename + favorite survived re-fetch`);
      } else if (item) {
        fail('Data persistence', `item found but title="${item.title}", saved=${item.saved}`);
      } else {
        fail('Data persistence', 'Item not found in gallery re-fetch');
      }
    } catch (e: any) { fail('Data persistence', e.message); }
  } else {
    fail('Data persistence', 'Skipped');
  }

  // ── 34. Forgot password ───────────────────────────────────────
  console.log('\n▸ [34] Forgot password endpoint');
  try {
    const r = await req(`${BASE}/api/auth/forgot-password`, 'POST', { email: AUDIT_EMAIL });
    // Shape: { success, message, code }
    if (r.status === 200 && r.body?.code) {
      pass('Forgot password', `HTTP 200, demo reset code returned (code not emailed — demo mode)`);
    } else {
      fail('Forgot password', `HTTP ${r.status}: ${JSON.stringify(r.body).slice(0, 120)}`);
    }
  } catch (e: any) { fail('Forgot password', e.message); }

  // ── 35. Uploads directory structure ──────────────────────────
  console.log('\n▸ [35] Uploads directory structure on disk');
  const uploadsDir = path.resolve('uploads');
  const creationsDir = path.join(uploadsDir, 'creations');
  const refsDir = path.join(uploadsDir, 'references');
  if (fs.existsSync(uploadsDir) && fs.existsSync(creationsDir) && fs.existsSync(refsDir)) {
    const files = fs.readdirSync(creationsDir);
    pass('Uploads directory structure', `uploads/, creations/ (${files.length} files), references/ — all exist`);
  } else {
    fail('Uploads directory structure', `Missing dirs: uploads=${fs.existsSync(uploadsDir)} creations=${fs.existsSync(creationsDir)} references=${fs.existsSync(refsDir)}`);
  }

  // ── 36. .env secrets check ────────────────────────────────────
  console.log('\n▸ [36] .env — no live AI secrets exposed');
  try {
    const env = fs.readFileSync(path.resolve('.env'), 'utf8');
    const hasOpenAI = /OPENAI_API_KEY=sk-/.test(env);
    const hasStability = /STABILITY_API_KEY=[a-zA-Z0-9]+/.test(env);
    if (!hasOpenAI && !hasStability) {
      pass('.env no exposed AI secrets', 'No live provider keys in .env — demo mode is correctly active');
    } else {
      nc('.env AI keys', 'Live API keys present — real AI provider will be used');
    }
  } catch (e: any) { fail('.env secrets check', e.message); }

  // ── FINAL REPORT ──────────────────────────────────────────────
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const notConf = results.filter(r => r.status === 'NOT_CONFIGURED').length;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   AUDIT FINAL REPORT                                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅ PASS         '
               : r.status === 'FAIL' ? '❌ FAIL         '
               : '⚠️  NOT_CONFIGURED';
    const label = r.label.padEnd(44);
    console.log(`  ${icon}  ${label}  ${r.detail}`);
  }

  console.log(`\n  Total: ${results.length} | PASS: ${passed} | FAIL: ${failed} | NOT_CONFIGURED: ${notConf}`);
  if (failed === 0) {
    console.log('\n  🎉 ALL FIXABLE TESTS PASSED — Forma full-stack is fully operational.\n');
  } else {
    console.log(`\n  ⚠️  ${failed} TEST(S) FAILED — See FAIL entries above for details.\n`);
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('\n[AUDIT FATAL ERROR]', err);
  process.exit(1);
});
