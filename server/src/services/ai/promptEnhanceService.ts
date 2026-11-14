import axios from 'axios';
import https from 'node:https';

const ipv4Agent = new https.Agent({ family: 4, keepAlive: true });

const STYLE_ENHANCEMENT_HINTS: Record<string, string> = {
  Editorial: 'vogue editorial style, 35mm portrait lens, cinematic rim lighting, textured fabrics, elegant poise',
  Minimal: 'minimalist composition, vast negative space, soft muted palette, serene lighting, subtle gradients',
  Architectural: 'bold architectural lines, geometric symmetry, concrete and glass reflections, atmospheric lighting',
  Monochrome: 'stunning black and white, deep blacks, high contrast chiaroscuro, tactile surfaces, timeless feel',
};

export async function enhancePromptWithAI(
  prompt: string,
  style?: string
): Promise<{ enhancedPrompt: string; provider: string }> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    return { enhancedPrompt: '', provider: 'none' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const styleHint = style && STYLE_ENHANCEMENT_HINTS[style] ? STYLE_ENHANCEMENT_HINTS[style] : '';

  if (apiKey) {
    const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

    for (const model of candidateModels) {
      try {
        const instruction =
          `You are an expert visual prompt engineer for advanced AI image generators (FLUX, Midjourney).\n` +
          `Expand the user's input prompt into a descriptive, high-quality visual prompt in 1 to 2 sentences.\n` +
          `STRICT RULES:\n` +
          `1. Strictly preserve the original subject, action, and core meaning. Do NOT change or replace the main subject.\n` +
          `2. Do NOT add unrelated characters, objects, or themes that contradict the input.\n` +
          `3. Enhance visual realism with precise details: lighting (e.g. volumetric, rim, soft natural light), camera perspective, focal length, surface textures, and color atmosphere.\n` +
          (styleHint ? `4. Align with the aesthetic: ${styleHint}.\n` : '') +
          `5. Return ONLY the enhanced prompt. No preamble, conversational remarks, or quotation marks.`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: `${instruction}\n\nUser prompt: ${cleanPrompt}` }],
              },
            ],
          },
          {
            httpsAgent: ipv4Agent,
            timeout: 10000,
          }
        );

        const candidateText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (candidateText && candidateText.length > 20) {
          const finalPrompt = candidateText.replace(/^["'`]+|["'`]+$/g, '').trim();
          return {
            enhancedPrompt: finalPrompt,
            provider: `Google Gemini (${model})`,
          };
        }
      } catch (err: any) {
        console.warn(`[PromptEnhance] Model ${model} failed (${err.response?.status || err.message}), trying next...`);
      }
    }
  }

  // Fallback Heuristic Prompt Enhancer (instant, zero network dependencies)
  const additions: string[] = [];
  if (styleHint) additions.push(styleHint);
  else additions.push('photorealistic studio lighting, tactile surfaces, 8k resolution, cinematic color grading, sharp focus');

  const enhanced = `${cleanPrompt}, captured with an 85mm f/1.4 lens, ${additions.join(', ')}`;
  return {
    enhancedPrompt: enhanced,
    provider: 'Forma Heuristic Aesthetic Engine',
  };
}

