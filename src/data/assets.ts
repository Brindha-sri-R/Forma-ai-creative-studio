import type { AssetSlot } from '../types/studio';

export interface StudioMediaAsset {
  id: string;
  src: string;
  expectedPath: string;
  objectPosition: string;
  title: string;
  keywords: readonly string[];
}

export const STUDIO_ASSETS = {
  img1: {
    id: 'img-1',
    src: '/assets/IMG%201.jpg',
    expectedPath: '/assets/IMG 1.jpg',
    objectPosition: 'center 34%',
    title: 'Botanical Macaw Dada Collage',
    keywords: ['macaw', 'parrot', 'bird', 'collage', 'botanical', 'dada', 'flower', 'turquoise'],
  },
  img2: {
    id: 'img-2',
    src: '/assets/IMG%202.jpg',
    expectedPath: '/assets/IMG 2.jpg',
    objectPosition: 'center 34%',
    title: 'Coastal Tide & Seabirds',
    keywords: ['coast', 'ocean', 'sea', 'seagull', 'gull', 'wave', 'tide', 'cumulus', 'cloud'],
  },
  img3: {
    id: 'img-3',
    src: '/assets/IMG%203.jpg',
    expectedPath: '/assets/IMG 3.jpg',
    objectPosition: 'center 60%',
    title: 'Crimson Cobra Mask Dancer',
    keywords: ['cobra', 'mask', 'dancer', 'serpent', 'crown', 'performer', 'orbit', 'stage'],
  },
  img4: {
    id: 'img-4',
    src: '/assets/IMG%204.jpg',
    expectedPath: '/assets/IMG 4.jpg',
    objectPosition: 'center 22%',
    title: 'Vermilion Ritual Guardian',
    keywords: ['ritual', 'guardian', 'vermilion', 'headdress', 'mandala', 'ribbon', 'indian', 'crimson'],
  },
  img5: {
    id: 'img-5',
    src: '/assets/IMG%205.jpg',
    expectedPath: '/assets/IMG 5.jpg',
    objectPosition: 'center 44%',
    title: 'Giant Greyhound & Traveler',
    keywords: ['greyhound', 'suit', 'mustard', 'twilight', 'scale', 'surreal', 'traveler'],
  },
  img6: {
    id: 'img-6',
    src: '/assets/IMG%206.jpg',
    expectedPath: '/assets/IMG 6.jpg',
    objectPosition: 'center 46%',
    title: 'Banana Peel Hound Portrait',
    keywords: ['banana', 'dog', 'hound', 'cream', 'pop', 'charcoal', 'portrait'],
  },
  img7: {
    id: 'img-7',
    src: '/assets/IMG%207.jpg',
    expectedPath: '/assets/IMG 7.jpg',
    objectPosition: 'center 46%',
    title: 'Crimson Dune & Crescent Moon',
    keywords: ['dune', 'desert', 'mars', 'planet', 'moon', 'crescent', 'volcanic', 'red', 'pan'],
  },
  img8: {
    id: 'img-8',
    src: '/assets/IMG%208.jpg',
    expectedPath: '/assets/IMG 8.jpg',
    objectPosition: 'center 48%',
    title: 'Stone Hand Alpine Tarn',
    keywords: ['alpine', 'mountain', 'stone', 'hand', 'tarn', 'pool', 'moss', 'mirror', 'lake'],
  },
} as const satisfies Record<string, StudioMediaAsset>;

export const STUDIO_ASSET_LIST: readonly StudioMediaAsset[] = Object.values(STUDIO_ASSETS);

export function isPlayableVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url) || url.startsWith('blob:');
}

export function pickStudioAssetForPrompt(prompt: string, seed = 0): StudioMediaAsset {
  const normalized = prompt.trim().toLowerCase();
  if (normalized) {
    const matched = STUDIO_ASSET_LIST.find((asset) =>
      asset.keywords.some((kw) => normalized.includes(kw))
    );
    if (matched) return matched;
  }

  let hash = Math.abs(seed);
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return STUDIO_ASSET_LIST[hash % STUDIO_ASSET_LIST.length];
}

export function pickStudioVariationAsset(
  primaryUrl: string | null | undefined,
  variationIndex: number,
  seed = 0
): StudioMediaAsset {
  const baseIdx = Math.max(
    0,
    STUDIO_ASSET_LIST.findIndex((asset) => asset.src === primaryUrl)
  );
  const offset = (baseIdx + variationIndex + (seed % STUDIO_ASSET_LIST.length)) % STUDIO_ASSET_LIST.length;
  return STUDIO_ASSET_LIST[offset];
}

/**
 * Central manifest of studio media frames.
 * Curated stills and animated motion study keyframes reside under `public/assets/`.
 */
export const INITIAL_ASSET_SLOTS: AssetSlot[] = [
  {
    id: 'hero-01',
    section: 'hero',
    label: 'Frame 01',
    mediaKind: 'image',
    aspectRatio: '4:5',
    recommendedSize: '1080 × 1350',
    src: STUDIO_ASSETS.img1.src,
    expectedPath: STUDIO_ASSETS.img1.expectedPath,
    objectPosition: STUDIO_ASSETS.img1.objectPosition,
    title: STUDIO_ASSETS.img1.title,
    prompt:
      'Surreal editorial paper-cut collage featuring monochrome profile portrait, turquoise sky backdrop, peach solar disc, azure blossoms, and perched blue-gold macaw',
  },
  {
    id: 'hero-02',
    section: 'hero',
    label: 'Frame 02',
    mediaKind: 'image',
    aspectRatio: '4:5',
    recommendedSize: '1200 × 1450',
    src: STUDIO_ASSETS.img2.src,
    expectedPath: STUDIO_ASSETS.img2.expectedPath,
    objectPosition: STUDIO_ASSETS.img2.objectPosition,
    title: STUDIO_ASSETS.img2.title,
    prompt:
      'Detailed crosshatched editorial illustration of a coastal villager in a crimson patterned sarong facing the ocean swell surrounded by soaring seagulls and cumulus clouds',
  },
  {
    id: 'hero-03',
    section: 'hero',
    label: 'Frame 03',
    mediaKind: 'image',
    aspectRatio: '2:3',
    recommendedSize: '1000 × 1500',
    src: STUDIO_ASSETS.img3.src,
    expectedPath: STUDIO_ASSETS.img3.expectedPath,
    objectPosition: 'center 62%',
    title: STUDIO_ASSETS.img3.title,
    prompt:
      'High-contrast studio photograph of a traditional masked folk performer in crimson embroidered attire and fanned serpent crown against a pitch-black cyclorama',
  },
  {
    id: 'hero-04',
    section: 'hero',
    label: 'Frame 04',
    mediaKind: 'image',
    aspectRatio: '2:3',
    recommendedSize: '736 × 1104',
    src: STUDIO_ASSETS.img4.src,
    expectedPath: STUDIO_ASSETS.img4.expectedPath,
    objectPosition: STUDIO_ASSETS.img4.objectPosition,
    title: STUDIO_ASSETS.img4.title,
    prompt:
      'Bold graphic comic illustration of a traditional South Indian ritual figure in a towering concentric crimson headdress with flowing ceremonial ribbons on burnt umber mandala pattern',
  },
  {
    id: 'hero-05',
    section: 'hero',
    label: 'Frame 05',
    mediaKind: 'image',
    aspectRatio: '4:5',
    recommendedSize: '1080 × 1350',
    src: STUDIO_ASSETS.img5.src,
    expectedPath: STUDIO_ASSETS.img5.expectedPath,
    objectPosition: STUDIO_ASSETS.img5.objectPosition,
    title: STUDIO_ASSETS.img5.title,
    prompt:
      'Surrealist scale painting of a young man in a mustard tailored suit resting calmly against a colossal greyhound silhouette under warm twilight rim light',
  },
  {
    id: 'hero-06',
    section: 'hero',
    label: 'Frame 06',
    mediaKind: 'image',
    aspectRatio: '4:5',
    recommendedSize: '1200 × 1500',
    src: STUDIO_ASSETS.img6.src,
    expectedPath: STUDIO_ASSETS.img6.expectedPath,
    objectPosition: STUDIO_ASSETS.img6.objectPosition,
    title: STUDIO_ASSETS.img6.title,
    prompt:
      'Warm painterly digital illustration of a serene cream dog wearing a peeled yellow banana crown against a deep charcoal textured ground',
  },
  {
    id: 'hero-07',
    section: 'hero',
    label: 'Frame 07',
    mediaKind: 'image',
    aspectRatio: '9:16',
    recommendedSize: '576 × 1024',
    src: STUDIO_ASSETS.img7.src,
    expectedPath: STUDIO_ASSETS.img7.expectedPath,
    objectPosition: STUDIO_ASSETS.img7.objectPosition,
    title: STUDIO_ASSETS.img7.title,
    prompt:
      'Expansive iron-red planetary desert scattered with volcanic boulders under an oversized pale crescent moon rising behind jagged haze mountains',
  },
  {
    id: 'gallery-01',
    section: 'gallery',
    label: 'Gallery 01',
    mediaKind: 'image',
    aspectRatio: '9:16',
    recommendedSize: '1200 × 2133',
    src: STUDIO_ASSETS.img8.src,
    expectedPath: STUDIO_ASSETS.img8.expectedPath,
    objectPosition: STUDIO_ASSETS.img8.objectPosition,
    title: STUDIO_ASSETS.img8.title,
    prompt:
      'Ligne-claire alpine fantasy illustration of a mossy stone giant hand cradling a mirror-still mountain pool with white birds and a cloaked traveler touching the granite thumb',
    creatorHandle: '@stills.studio',
    tags: ['trending', 'recent'],
  },
  {
    id: 'gallery-02',
    section: 'gallery',
    label: 'Gallery 02',
    mediaKind: 'image',
    aspectRatio: '4:5',
    recommendedSize: '1080 × 1350',
    src: STUDIO_ASSETS.img1.src,
    expectedPath: STUDIO_ASSETS.img1.expectedPath,
    objectPosition: STUDIO_ASSETS.img1.objectPosition,
    title: STUDIO_ASSETS.img1.title,
    prompt:
      'Surreal editorial paper-cut collage featuring monochrome profile portrait, turquoise sky backdrop, peach solar disc, azure blossoms, and perched blue-gold macaw',
    creatorHandle: '@object.form',
    tags: ['recent'],
  },
  {
    id: 'gallery-03',
    section: 'gallery',
    label: 'Gallery 03',
    mediaKind: 'video',
    aspectRatio: '4:5',
    recommendedSize: '1080 × 1350 · 24fps',
    src: STUDIO_ASSETS.img7.src,
    expectedPath: STUDIO_ASSETS.img7.expectedPath,
    objectPosition: STUDIO_ASSETS.img7.objectPosition,
    title: 'Crimson Dune & Moon Pan',
    prompt:
      'Sweeping lateral pan across an iron-red planetary desert scattered with volcanic boulders under a rising crescent moon, 24fps filmic motion',
    creatorHandle: '@motion.lab',
    tags: ['trending', 'recent'],
  },
  {
    id: 'gallery-04',
    section: 'gallery',
    label: 'Gallery 04',
    mediaKind: 'image',
    aspectRatio: '4:5',
    recommendedSize: '1200 × 1450',
    src: STUDIO_ASSETS.img2.src,
    expectedPath: STUDIO_ASSETS.img2.expectedPath,
    objectPosition: STUDIO_ASSETS.img2.objectPosition,
    title: STUDIO_ASSETS.img2.title,
    prompt:
      'Detailed crosshatched editorial illustration of a coastal villager in a crimson patterned sarong facing the ocean swell surrounded by soaring seagulls and cumulus clouds',
    creatorHandle: '@stills.studio',
    tags: ['recent'],
  },
  {
    id: 'gallery-05',
    section: 'gallery',
    label: 'Gallery 05',
    mediaKind: 'video',
    aspectRatio: '4:5',
    recommendedSize: '1080 × 1350 · 30fps',
    src: STUDIO_ASSETS.img3.src,
    expectedPath: STUDIO_ASSETS.img3.expectedPath,
    objectPosition: STUDIO_ASSETS.img3.objectPosition,
    title: 'Crimson Cobra Orbit Study',
    prompt:
      'Controlled dramatic arc orbit around a masked folk dancer in crimson embroidered attire emerging under crisp theatrical illumination, 30fps',
    creatorHandle: '@motion.lab',
    tags: ['trending'],
  },
  {
    id: 'gallery-06',
    section: 'gallery',
    label: 'Gallery 06',
    mediaKind: 'image',
    aspectRatio: '4:5',
    recommendedSize: '1080 × 1350',
    src: STUDIO_ASSETS.img5.src,
    expectedPath: STUDIO_ASSETS.img5.expectedPath,
    objectPosition: STUDIO_ASSETS.img5.objectPosition,
    title: STUDIO_ASSETS.img5.title,
    prompt:
      'Surrealist scale painting of a young man in a mustard tailored suit resting calmly against a colossal greyhound silhouette under warm twilight rim light',
    creatorHandle: '@archive.02',
    tags: ['trending', 'recent'],
  },
];
