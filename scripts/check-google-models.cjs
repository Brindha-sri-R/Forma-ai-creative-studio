const https = require('https');
const fs = require('fs');
const path = require('path');
const apiKey = process.env.GOOGLE_API_KEY;

const req = https.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + key, {
  family: 4, // Force IPv4
  timeout: 30000
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (!data.models) {
        console.log('No models returned:', body);
        return;
      }
      console.log('Total models:', data.models.length);
      const report = data.models.map(m => ({
        name: m.name,
        displayName: m.displayName,
        supportedMethods: m.supportedGenerationMethods
      }));
      fs.writeFileSync(path.join(__dirname, 'google-models.json'), JSON.stringify(report, null, 2));
      console.log('Saved google-models.json. Sample models with image/video or generate:');
      for (const m of report) {
        if (m.name.includes('image') || m.name.includes('video') || m.name.includes('omni') || m.name.includes('veo')) {
          console.log(`- ${m.name}: [${m.supportedMethods.join(', ')}] (${m.displayName})`);
        }
      }
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });
});

req.on('error', err => console.error('Request error:', err.message));
