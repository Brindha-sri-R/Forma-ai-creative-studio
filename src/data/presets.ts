import type {
  AspectRatio,
  FrameRate,
  GenerationMode,
  ImageStyle,
  PromptPreset,
  ResolutionOption,
  VideoDuration,
  VideoMotion,
} from '../types/studio';
import { STUDIO_ASSETS } from './assets';

export const MODELS_BY_MODE: Record<GenerationMode, { id: string; label: string; note: string }[]> = {
  image: [
    { id: 'free-flux-schnell', label: 'FLUX.1 Schnell (Zero-Cost)', note: 'Free Community Engine · 0 Cost, Real AI Image' },
    { id: 'gemini-3.1-flash-image', label: 'Gemini 3.1 Flash Image', note: 'Google AI Studio · 1K–4K High-detail' },
    { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', note: 'Google Gemini multimodal' },
  ],
  video: [
    { id: 'gemini-omni-1.2-flash', label: 'Gemini Omni Flash 1.2 (Unavailable: Billing Required)', note: 'Zero-cost policy active: Video APIs require paid billing. Kept unavailable.' },
  ],
};

export const ASPECT_RATIOS: {
  value: AspectRatio;
  label: string;
  dimensions: Record<GenerationMode, Record<ResolutionOption, string>>;
}[] = [
  {
    value: '1:1',
    label: '1:1',
    dimensions: {
      image: { '1K': '1024 × 1024', '2K': '2048 × 2048', '4K': '4096 × 4096' },
      video: { '1K': '720 × 720', '2K': '1080 × 1080', '4K': '2160 × 2160' },
    },
  },
  {
    value: '4:5',
    label: '4:5',
    dimensions: {
      image: { '1K': '1024 × 1280', '2K': '1792 × 2240', '4K': '3072 × 3840' },
      video: { '1K': '720 × 900', '2K': '1080 × 1350', '4K': '1728 × 2160' },
    },
  },
  {
    value: '16:9',
    label: '16:9',
    dimensions: {
      image: { '1K': '1344 × 768', '2K': '2560 × 1440', '4K': '3840 × 2160' },
      video: { '1K': '1280 × 720', '2K': '1920 × 1080', '4K': '3840 × 2160' },
    },
  },
  {
    value: '9:16',
    label: '9:16',
    dimensions: {
      image: { '1K': '768 × 1344', '2K': '1440 × 2560', '4K': '2160 × 3840' },
      video: { '1K': '720 × 1280', '2K': '1080 × 1920', '4K': '2160 × 3840' },
    },
  },
];

export const RESOLUTIONS: ResolutionOption[] = ['1K', '2K', '4K'];

export const IMAGE_STYLES: ImageStyle[] = ['Editorial', 'Minimal', 'Architectural', 'Monochrome'];

export const VARIATION_COUNTS: (1 | 2 | 4)[] = [1, 2, 4];

export const VIDEO_DURATIONS: VideoDuration[] = ['4s', '8s', '12s'];

export const VIDEO_MOTIONS: VideoMotion[] = ['Static', 'Slow Dolly', 'Orbit', 'Lateral Pan'];

export const VIDEO_FRAME_RATES: FrameRate[] = ['24 fps', '30 fps'];

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'preset-collage',
    label: 'Botanical Dada Collage',
    subtitle: 'Editorial · 4:5',
    mode: 'image',
    aspectRatio: '4:5',
    style: 'Editorial',
    thumbSrc: STUDIO_ASSETS.img1.src,
    thumbPosition: STUDIO_ASSETS.img1.objectPosition,
    prompt:
      'Surreal editorial paper-cut collage featuring monochrome profile portrait, turquoise backdrop, peach solar disc, azure blossoms, and perched blue-gold macaw',
  },
  {
    id: 'preset-ritual',
    label: 'Crimson Ritual Portrait',
    subtitle: 'Architectural · 4:5',
    mode: 'image',
    aspectRatio: '4:5',
    style: 'Architectural',
    thumbSrc: STUDIO_ASSETS.img4.src,
    thumbPosition: STUDIO_ASSETS.img4.objectPosition,
    prompt:
      'Bold editorial illustration of a South Indian ritual figure in a towering concentric crimson headdress with flowing ceremonial ribbons on burnt umber mandala ground',
  },
  {
    id: 'preset-scale',
    label: 'Twilight Scale Study',
    subtitle: 'Minimal · 4:5',
    mode: 'image',
    aspectRatio: '4:5',
    style: 'Minimal',
    thumbSrc: STUDIO_ASSETS.img5.src,
    thumbPosition: STUDIO_ASSETS.img5.objectPosition,
    prompt:
      'Surrealist scale painting of a young man in a mustard tailored suit resting calmly against a colossal greyhound silhouette under warm twilight rim light',
  },
  {
    id: 'preset-coastal-dolly',
    label: 'Coastal Tide Dolly',
    subtitle: 'Slow Dolly · 24fps',
    mode: 'video',
    aspectRatio: '16:9',
    motion: 'Slow Dolly',
    thumbSrc: STUDIO_ASSETS.img2.src,
    thumbPosition: STUDIO_ASSETS.img2.objectPosition,
    prompt:
      'Smooth forward camera dolly past soaring coastal seagulls and ocean swell toward a crimson-sarong traveler beneath sculpted cumulus clouds, 24fps filmic motion',
  },
  {
    id: 'preset-dune-pan',
    label: 'Crimson Moon Pan',
    subtitle: 'Lateral Pan · 30fps',
    mode: 'video',
    aspectRatio: '9:16',
    motion: 'Lateral Pan',
    thumbSrc: STUDIO_ASSETS.img7.src,
    thumbPosition: STUDIO_ASSETS.img7.objectPosition,
    prompt:
      'Continuous lateral pan across an iron-red volcanic desert horizon as an oversized pale crescent moon rises slowly behind dusty ridge lines, 30fps atmospheric motion',
  },
  {
    id: 'preset-alpine-orbit',
    label: 'Alpine Tarn Orbit',
    subtitle: 'Orbit · 24fps',
    mode: 'video',
    aspectRatio: '9:16',
    motion: 'Orbit',
    thumbSrc: STUDIO_ASSETS.img8.src,
    thumbPosition: STUDIO_ASSETS.img8.objectPosition,
    prompt:
      'Gentle orbital camera movement around a mossy stone giant hand cradling an alpine mirror pool as white birds glide through crisp morning mist, 24fps',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Describe your vision',
    copy: 'Write a prompt or upload a reference.',
  },
  {
    step: '02',
    title: 'Choose your style',
    copy: 'Set your visual preferences and generation options.',
  },
  {
    step: '03',
    title: 'Create & refine',
    copy: 'Generate, explore variations, and perfect your result.',
  },
] as const;

export const AUDIENCE_PILLARS = [
  'Designers & digital creators',
  'Video editors & filmmakers',
  'Marketing & creative teams',
  'Agencies & production studios',
] as const;

export const PRICING_PLANS = [
  {
    id: 'free',
    tier: 'Free',
    priceInr: '₹0',
    period: '/ month',
    credits: '25 monthly credits',
    description: 'Explore prompt-driven still and short motion tests in a focused workspace.',
    features: [
      'Text-to-Image & Text-to-Video modes',
      '1K standard export resolution',
      'Personal creations library & collections',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    id: 'pro',
    tier: 'Pro',
    priceInr: '₹1,499',
    period: '/ month',
    credits: '500 monthly credits',
    description: 'For designers, filmmakers, and creators crafting production-ready assets daily.',
    features: [
      'Up to 4K stills & 12s cinematic video',
      'Reference image & video conditioning',
      '4 variations per batch & priority queue',
    ],
    cta: 'Upgrade to Pro',
    featured: true,
  },
  {
    id: 'studio',
    tier: 'Studio',
    priceInr: '₹3,999',
    period: '/ month',
    credits: '2,000 shared credits',
    description: 'For agencies, marketing teams, and studios running custom model pipelines.',
    features: [
      'Shared collections & team workspace roles',
      'Dedicated API adapter & webhook integration',
      'Commercial ownership & priority support',
    ],
    cta: 'Contact Sales',
    featured: false,
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: 'How does AI generation work?',
    answer:
      'Enter a descriptive text prompt and optionally attach a visual reference. Our studio packages your style, aspect ratio, resolution, and motion controls into a structured generation pipeline that outputs ready-to-refine stills or motion clips.',
  },
  {
    question: 'Can I generate both images and videos?',
    answer:
      'Yes. Image Generation and Video Generation live inside one shared studio workspace so you can switch formats without re-entering prompts, references, or style direction.',
  },
  {
    question: 'Can I upload reference images?',
    answer:
      'Yes. You can attach reference images or video clips directly in the composer to guide composition, lighting, color palette, or image-to-video motion.',
  },
  {
    question: 'Who owns the generated content?',
    answer:
      'Creators and teams retain full commercial rights to assets generated under Pro and Studio plans, subject to standard platform usage terms.',
  },
  {
    question: 'Are generations downloadable?',
    answer:
      'Every asset in your workspace and My Creations library supports instant preview, rename, duplicate, collection saving, and export.',
  },
  {
    question: 'What happens when I run out of credits?',
    answer:
      'Existing assets in My Creations remain accessible anytime. You can upgrade your INR plan or top up credits inside Credits & Plans to resume new generations immediately.',
  },
] as const;
