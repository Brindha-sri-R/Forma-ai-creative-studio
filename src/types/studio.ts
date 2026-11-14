export type AppView = 'public' | 'studio';

export type StudioSection =
  | 'dashboard'
  | 'create'
  | 'creations'
  | 'explore'
  | 'credits'
  | 'settings';

export type GenerationMode = 'image' | 'video';

export type AspectRatio = '1:1' | '4:5' | '16:9' | '9:16';

export type ResolutionOption = '1K' | '2K' | '4K';

export type ImageStyle = 'Editorial' | 'Minimal' | 'Architectural' | 'Monochrome';

export type VideoMotion = 'Static' | 'Slow Dolly' | 'Orbit' | 'Lateral Pan';

export type VideoDuration = '4s' | '8s' | '12s';

export type FrameRate = '24 fps' | '30 fps';

export type ExploreFilter = 'all' | 'image' | 'video' | 'trending' | 'recent';

export type CreationsFilter = 'all' | 'image' | 'video' | 'collections' | 'saved';

export type GenerationUxState =
  | 'idle'
  | 'uploading'
  | 'generating'
  | 'processing'
  | 'success'
  | 'failed'
  | 'no-credits';

export interface AssetSlot {
  /** Unique slot key used across hero, gallery, and live preview overrides. */
  id: string;
  section: 'hero' | 'gallery';
  label: string;
  mediaKind: GenerationMode;
  aspectRatio: string;
  recommendedSize: string;
  /** Default path under public/assets/ — leave null while frame stays empty. */
  src: string | null;
  expectedPath: string;
  objectPosition?: string;
  title: string;
  prompt: string;
  creatorHandle?: string;
  tags?: ('trending' | 'recent')[];
}

export interface GenerationRequest {
  mode: GenerationMode;
  prompt: string;
  negativePrompt: string;
  model: string;
  aspectRatio: AspectRatio;
  resolution: ResolutionOption;
  style: ImageStyle;
  variations: 1 | 2 | 4;
  duration: VideoDuration;
  motion: VideoMotion;
  fps: FrameRate;
  referenceAssetUrl: string | null;
  referenceAssetName: string | null;
  referenceMediaKind: GenerationMode | null;
}

export interface CreationItem {
  id: string;
  title: string;
  createdAt: string;
  request: GenerationRequest;
  seed: number;
  dimensions: string;
  creditsUsed: number;
  provider: 'adapter-mock' | 'custom-api' | 'forma-engine' | string;
  /** Media URL populated when a live API returns an asset or the user places a test asset. */
  mediaUrl: string | null;
  mediaKind: GenerationMode;
  saved: boolean;
  collection?: string;
}

export interface PromptPreset {
  id: string;
  label: string;
  mode: GenerationMode;
  prompt: string;
  aspectRatio: AspectRatio;
  style?: ImageStyle;
  motion?: VideoMotion;
  thumbSrc?: string;
  thumbPosition?: string;
  subtitle?: string;
}

export interface CreditUsageEntry {
  id: string;
  label: string;
  mode: GenerationMode | 'topup';
  delta: number;
  timestamp: string;
}
