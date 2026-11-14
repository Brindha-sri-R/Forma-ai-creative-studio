import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  Download,
  Eye,
  Film,
  Image as ImageIcon,
  Layers,
  Paperclip,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand';
import {
  STUDIO_ASSETS,
  isPlayableVideoUrl,
  pickStudioAssetForPrompt,
  pickStudioVariationAsset,
} from '../../data/assets';
import {
  ASPECT_RATIOS,
  IMAGE_STYLES,
  MODELS_BY_MODE,
  PROMPT_PRESETS,
  RESOLUTIONS,
  VARIATION_COUNTS,
  VIDEO_DURATIONS,
  VIDEO_FRAME_RATES,
  VIDEO_MOTIONS,
} from '../../data/presets';
import { calculateCreditCost, runGeneration, type GenerationProgress } from '../../services/generationService';
import { api, getStoredToken } from '../../services/apiClient';
import {
  ImpulseReelSkeleton,
  InlineSpinner,
  PresetStartersSkeleton,
  ProgressiveImage,
  SkeletonBlock,
  SpotlightStageSkeleton,
  useSkeletonTransition,
} from '../MinimalLoaders';
import type {
  AspectRatio,
  CreationItem,
  FrameRate,
  GenerationMode,
  GenerationRequest,
  GenerationUxState,
  ImageStyle,
  ResolutionOption,
  VideoDuration,
  VideoMotion,
} from '../../types/studio';

interface CreateWorkspaceProps {
  credits: number;
  creations: CreationItem[];
  draftPromptTrigger: {
    mode: GenerationMode;
    prompt?: string;
    aspectRatio?: AspectRatio;
    nonce: number;
  } | null;
  textareaRef: RefObject<HTMLTextAreaElement>;
  onConsumeCredits: (amount: number, label: string, mode: GenerationMode) => void;
  onAddCreation: (item: CreationItem) => void;
  onToggleSave: (creationId: string) => void;
  onDownloadCreation: (item: CreationItem) => void;
  onPreviewCreation: (item: CreationItem) => void;
  onNavigateCredits: () => void;
  onClearHistory: () => void;
  onDraftChange?: (hasActiveDraft: boolean) => void;
}

interface InspirationReelItem {
  id: string;
  title: string;
  category: GenerationMode;
  tag: string;
  src: string;
  objectPosition: string;
  aspectRatio: AspectRatio;
  style: ImageStyle;
  motion: VideoMotion;
  duration: VideoDuration;
  kbClass: 'is-kb-zoom' | 'is-kb-pan' | 'is-kb-orbit' | 'is-kb-drift';
  prompt: string;
}

const STUDIO_INSPIRATION_REEL: InspirationReelItem[] = [
  {
    id: 'insp-1',
    title: 'Botanical Macaw Collage',
    category: 'image',
    tag: 'Editorial Still',
    src: STUDIO_ASSETS.img1.src,
    objectPosition: STUDIO_ASSETS.img1.objectPosition,
    aspectRatio: '4:5',
    style: 'Editorial',
    motion: 'Static',
    duration: '4s',
    kbClass: 'is-kb-zoom',
    prompt:
      'Surreal editorial paper-cut collage featuring monochrome profile portrait, turquoise sky backdrop, peach solar disc, azure blossoms, and perched blue-gold macaw',
  },
  {
    id: 'insp-2',
    title: 'Coastal Tide & Seabirds',
    category: 'video',
    tag: 'Art Motion · 24fps',
    src: STUDIO_ASSETS.img2.src,
    objectPosition: STUDIO_ASSETS.img2.objectPosition,
    aspectRatio: '16:9',
    style: 'Editorial',
    motion: 'Slow Dolly',
    duration: '8s',
    kbClass: 'is-kb-pan',
    prompt:
      'Smooth camera dolly through soaring coastal seagulls and rolling sea mist toward a figure in a crimson patterned sarong facing sculpted ocean cumulus clouds, 24fps',
  },
  {
    id: 'insp-3',
    title: 'Crimson Cobra Mask',
    category: 'video',
    tag: 'Kinetic Orbit · 24fps',
    src: STUDIO_ASSETS.img3.src,
    objectPosition: STUDIO_ASSETS.img3.objectPosition,
    aspectRatio: '9:16',
    style: 'Architectural',
    motion: 'Orbit',
    duration: '8s',
    kbClass: 'is-kb-orbit',
    prompt:
      'Controlled dramatic arc orbit around a masked folk dancer in crimson embroidered attire and serpent crown emerging under theatrical spot illumination, 24fps',
  },
  {
    id: 'insp-4',
    title: 'Vermilion Ritual Guardian',
    category: 'image',
    tag: 'Graphic Illustration',
    src: STUDIO_ASSETS.img4.src,
    objectPosition: STUDIO_ASSETS.img4.objectPosition,
    aspectRatio: '4:5',
    style: 'Architectural',
    motion: 'Static',
    duration: '4s',
    kbClass: 'is-kb-drift',
    prompt:
      'Bold comic ink illustration of a traditional ritual guardian wearing a towering concentric crimson headdress with flowing ribbons over a burnt umber mandala motif',
  },
  {
    id: 'insp-5',
    title: 'Giant Greyhound & Traveler',
    category: 'image',
    tag: 'Surrealist Painting',
    src: STUDIO_ASSETS.img5.src,
    objectPosition: STUDIO_ASSETS.img5.objectPosition,
    aspectRatio: '4:5',
    style: 'Minimal',
    motion: 'Static',
    duration: '4s',
    kbClass: 'is-kb-zoom',
    prompt:
      'Surrealist scale painting of a calm traveler in a mustard tailored suit seated against a monumental greyhound silhouette bathed in warm twilight rim light',
  },
  {
    id: 'insp-6',
    title: 'Crimson Dune & Crescent Moon',
    category: 'video',
    tag: 'Panorama Pan · 30fps',
    src: STUDIO_ASSETS.img7.src,
    objectPosition: STUDIO_ASSETS.img7.objectPosition,
    aspectRatio: '16:9',
    style: 'Editorial',
    motion: 'Lateral Pan',
    duration: '8s',
    kbClass: 'is-kb-pan',
    prompt:
      'Sweeping lateral pan across an iron-red planetary desert scattered with volcanic boulders as a pale giant crescent moon rises through dusty mountain haze, 30fps',
  },
  {
    id: 'insp-7',
    title: 'Banana Peel Hound Portrait',
    category: 'image',
    tag: 'Editorial Pop Still',
    src: STUDIO_ASSETS.img6.src,
    objectPosition: STUDIO_ASSETS.img6.objectPosition,
    aspectRatio: '1:1',
    style: 'Editorial',
    motion: 'Static',
    duration: '4s',
    kbClass: 'is-kb-drift',
    prompt:
      'Warm textured digital painting of a serene white cream dog balancing a bright peeled yellow banana crown against a velvety matte charcoal canvas',
  },
  {
    id: 'insp-8',
    title: 'Stone Hand Alpine Tarn',
    category: 'video',
    tag: 'Scenic Drift · 24fps',
    src: STUDIO_ASSETS.img8.src,
    objectPosition: STUDIO_ASSETS.img8.objectPosition,
    aspectRatio: '9:16',
    style: 'Minimal',
    motion: 'Slow Dolly',
    duration: '12s',
    kbClass: 'is-kb-orbit',
    prompt:
      'Gentle vertical dolly across a ligne-claire alpine mountain mirror cradled inside a colossal mossy stone palm with birds gliding smoothly past misted peaks, 24fps',
  },
];

function getRatioClass(ratio: AspectRatio): string {
  switch (ratio) {
    case '1:1':
      return 'ratio-1-1';
    case '4:5':
      return 'ratio-4-5';
    case '16:9':
      return 'ratio-16-9';
    case '9:16':
      return 'ratio-9-16';
  }
}

function getStageMaxWidth(ratio: AspectRatio): number {
  switch (ratio) {
    case '9:16':
      return 240;
    case '4:5':
      return 316;
    case '1:1':
      return 364;
    case '16:9':
      return 430;
  }
}

function getRatioGlyphDimensions(ratio: AspectRatio): { width: number; height: number } {
  switch (ratio) {
    case '1:1':
      return { width: 11, height: 11 };
    case '4:5':
      return { width: 10, height: 12 };
    case '16:9':
      return { width: 14, height: 8 };
    case '9:16':
      return { width: 8, height: 14 };
  }
}

export function CreateWorkspace({
  credits,
  creations,
  draftPromptTrigger,
  textareaRef,
  onConsumeCredits,
  onAddCreation,
  onToggleSave,
  onDownloadCreation,
  onPreviewCreation,
  onNavigateCredits,
  onClearHistory,
  onDraftChange,
}: CreateWorkspaceProps) {
  const [mode, setMode] = useState<GenerationMode>('image');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [model, setModel] = useState(MODELS_BY_MODE.image[0].id);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [resolution, setResolution] = useState<ResolutionOption>('2K');
  const [style, setStyle] = useState<ImageStyle>('Editorial');
  const [variations, setVariations] = useState<1 | 2 | 4>(1);
  const [duration, setDuration] = useState<VideoDuration>('4s');
  const [motion, setMotion] = useState<VideoMotion>('Slow Dolly');
  const [fps, setFps] = useState<FrameRate>('24 fps');
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [referenceName, setReferenceName] = useState<string | null>(null);
  const [referenceKind, setReferenceKind] = useState<GenerationMode | null>(null);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedSuccessMsg, setEnhancedSuccessMsg] = useState<string | null>(null);

  const [uxState, setUxState] = useState<GenerationUxState>('idle');
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [selectedCreationId, setSelectedCreationId] = useState<string | null>(null);
  const [selectedVariationIdx, setSelectedVariationIdx] = useState(0);
  const [showPayload, setShowPayload] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<'all' | GenerationMode>('all');
  const [marqueePaused, setMarqueePaused] = useState(false);
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const [spotlightPaused, setSpotlightPaused] = useState(false);
  const [stageShowcaseOverride, setStageShowcaseOverride] = useState(false);
  const [videoTick, setVideoTick] = useState(1);

  const referenceInputRef = useRef<HTMLInputElement>(null);
  const isStreamLoading = useSkeletonTransition(feedFilter, 340);
  const isStartersLoading = useSkeletonTransition(mode, 280);
  const isSpotlightLoading = useSkeletonTransition('stage-spotlight', 340);

  useEffect(() => {
    if (!draftPromptTrigger) return;
    setMode(draftPromptTrigger.mode);
    setModel(MODELS_BY_MODE[draftPromptTrigger.mode][0].id);
    if (draftPromptTrigger.prompt !== undefined) {
      setPrompt(draftPromptTrigger.prompt);
    }
    if (draftPromptTrigger.aspectRatio) {
      setAspectRatio(draftPromptTrigger.aspectRatio);
    }
    setUxState('idle');
    setErrorDetail(null);
    setStageShowcaseOverride(false);
  }, [draftPromptTrigger]);

  const handleModeSwitch = (nextMode: GenerationMode) => {
    setMode(nextMode);
    setModel(MODELS_BY_MODE[nextMode][0].id);
    if (nextMode === 'video' && aspectRatio === '4:5') {
      setAspectRatio('16:9');
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setEnhancedSuccessMsg(null);
    try {
      const res = await api.generate.enhance(prompt.trim(), style);
      if (res?.enhancedPrompt) {
        setPrompt(res.enhancedPrompt);
        setEnhancedSuccessMsg('Enhanced via AI');
        setTimeout(() => setEnhancedSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.warn('[CreateWorkspace] Enhance prompt failed:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleReferenceUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUxState('uploading');

    try {
      if (getStoredToken()) {
        const uploadRes = await api.upload.uploadReference(file);
        if (referenceUrl && referenceUrl.startsWith('blob:')) {
          URL.revokeObjectURL(referenceUrl);
        }
        setReferenceUrl(uploadRes.url);
        setReferenceName(uploadRes.filename);
        setReferenceKind(uploadRes.mediaKind);
      } else {
        if (referenceUrl && referenceUrl.startsWith('blob:')) {
          URL.revokeObjectURL(referenceUrl);
        }
        setReferenceUrl(URL.createObjectURL(file));
        setReferenceName(file.name);
        setReferenceKind(file.type.startsWith('video/') ? 'video' : 'image');
      }
    } catch (err) {
      console.warn('Upload to server failed, falling back to local preview:', err);
      if (referenceUrl && referenceUrl.startsWith('blob:')) {
        URL.revokeObjectURL(referenceUrl);
      }
      setReferenceUrl(URL.createObjectURL(file));
      setReferenceName(file.name);
      setReferenceKind(file.type.startsWith('video/') ? 'video' : 'image');
    } finally {
      setUxState('idle');
      event.target.value = '';
    }
  };

  const clearReference = () => {
    if (referenceUrl) {
      URL.revokeObjectURL(referenceUrl);
    }
    setReferenceUrl(null);
    setReferenceName(null);
    setReferenceKind(null);
  };

  const buildRequest = (): GenerationRequest => ({
    mode,
    prompt: prompt.trim(),
    negativePrompt: negativePrompt.trim(),
    model,
    aspectRatio,
    resolution,
    style,
    variations,
    duration,
    motion,
    fps,
    referenceAssetUrl: referenceUrl,
    referenceAssetName: referenceName,
    referenceMediaKind: referenceKind,
  });

  const requiredCredits = calculateCreditCost(buildRequest());

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || uxState === 'generating' || uxState === 'processing') return;

    if (credits < requiredCredits) {
      setUxState('no-credits');
      return;
    }

    setUxState('generating');
    setErrorDetail(null);
    setStageShowcaseOverride(false);
    setProgress({ phase: 'generating', progress: 20 });

    try {
      const request = buildRequest();
      const result = await runGeneration(request, (stage) => {
        setUxState(stage.phase);
        setProgress(stage);
      });
      onConsumeCredits(result.creditsUsed, result.title, result.mediaKind);
      onAddCreation(result);
      setSelectedCreationId(result.id);
      setSelectedVariationIdx(0);
      setUxState('success');
    } catch (error) {
      setErrorDetail(error instanceof Error ? error.message : null);
      setUxState('failed');
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void handleGenerate();
    }
  };

  const activeCreation =
    creations.find((item) => item.id === selectedCreationId) ?? creations[0] ?? null;

  const activeRatio = activeCreation?.request.aspectRatio ?? aspectRatio;
  const activeMode = activeCreation?.request.mode ?? mode;
  const hasReference = activeCreation
    ? Boolean(activeCreation.request.referenceAssetUrl)
    : Boolean(referenceUrl);
  const workflowLabel =
    activeMode === 'image'
      ? hasReference
        ? 'Reference-to-Image'
        : 'Text-to-Image'
      : hasReference
        ? 'Image-to-Video'
        : 'Text-to-Video';
  const variationCount =
    activeCreation &&
    activeCreation.request.mode === 'image' &&
    activeCreation.request.variations > 1
      ? activeCreation.request.variations
      : 1;
  const activeSeed = activeCreation ? activeCreation.seed + selectedVariationIdx : 0;

  const handleCopyPrompt = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  const isBusy = uxState === 'generating' || uxState === 'processing';
  const shownCreation = stageShowcaseOverride ? null : activeCreation;

  useEffect(() => {
    if (spotlightPaused || isBusy || shownCreation) return;
    const interval = window.setInterval(() => {
      setSpotlightIdx((prev) => (prev + 1) % STUDIO_INSPIRATION_REEL.length);
      setVideoTick(1);
    }, 4600);
    return () => window.clearInterval(interval);
  }, [spotlightPaused, isBusy, shownCreation]);

  useEffect(() => {
    if (spotlightPaused || isBusy || shownCreation) return;
    const ticker = window.setInterval(() => {
      setVideoTick((prev) => (prev >= 8 ? 1 : prev + 1));
    }, 1000);
    return () => window.clearInterval(ticker);
  }, [spotlightPaused, isBusy, shownCreation]);

  const applyInspiration = (item: InspirationReelItem) => {
    setMode(item.category);
    setModel(MODELS_BY_MODE[item.category][0].id);
    setPrompt(item.prompt);
    setAspectRatio(item.aspectRatio);
    setStyle(item.style);
    setMotion(item.motion);
    setDuration(item.duration);
    const idx = STUDIO_INSPIRATION_REEL.findIndex((entry) => entry.id === item.id);
    if (idx >= 0) setSpotlightIdx(idx);
    setStageShowcaseOverride(true);
    setUxState('idle');
    setErrorDetail(null);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    onDraftChange?.(Boolean(prompt.trim() || referenceUrl || isBusy));
  }, [prompt, referenceUrl, isBusy, onDraftChange]);

  useEffect(() => {
    return () => {
      onDraftChange?.(false);
    };
  }, [onDraftChange]);

  const filteredPresets = PROMPT_PRESETS.filter((preset) => preset.mode === mode);
  const currentRatioMeta = ASPECT_RATIOS.find((item) => item.value === aspectRatio);
  const filteredMarqueeSource =
    feedFilter === 'all'
      ? STUDIO_INSPIRATION_REEL
      : STUDIO_INSPIRATION_REEL.filter((item) => item.category === feedFilter);
  const marqueeLoopUnit =
    filteredMarqueeSource.length < 6
      ? [...filteredMarqueeSource, ...filteredMarqueeSource]
      : filteredMarqueeSource;
  const activeSpotlight = STUDIO_INSPIRATION_REEL[spotlightIdx] ?? STUDIO_INSPIRATION_REEL[0];

  return (
    <div className="studio-subview">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="section-eyebrow">Workspace</div>
          <h2 className="section-title">Create Something New</h2>
          <p className="section-subtitle">
            What are we creating today? Choose your format, describe your vision, and let AI do the
            rest.
          </p>
        </div>

        <span className="adapter-status-pill">
          <Zap size={12} strokeWidth={2} />
          <span>Cost: {requiredCredits} {requiredCredits === 1 ? 'credit' : 'credits'}</span>
        </span>
      </div>

      {uxState === 'no-credits' && (
        <div className="state-banner is-warning" role="alert">
          <div className="state-banner-content">
            <AlertCircle size={16} strokeWidth={2} />
            <div>
              <strong>{BRAND_CONFIG.uxStates.noCredits}</strong>
              <span style={{ marginLeft: 8, color: 'var(--ink-secondary)' }}>
                This generation requires {requiredCredits} credits ({credits} available).
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-pill btn-pill-sm btn-primary"
            onClick={onNavigateCredits}
          >
            <span>Upgrade Plan</span>
          </button>
        </div>
      )}

      {uxState === 'failed' && (
        <div className="state-banner is-error" role="alert">
          <div className="state-banner-content">
            <AlertCircle size={16} strokeWidth={2} />
            <div>
              <strong>{BRAND_CONFIG.uxStates.failed}</strong>
              {errorDetail && (
                <span style={{ marginLeft: 8, color: 'var(--ink-secondary)' }}>{errorDetail}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn-pill btn-pill-sm btn-outline"
            onClick={() => void handleGenerate()}
          >
            <RefreshCw size={12} strokeWidth={1.85} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      <div className="generator-impulse-banner" aria-label="Live art and motion showcase">
        <div className="impulse-banner-head">
          <div className="impulse-banner-title-group">
            <span className="impulse-live-badge">
              <span className="live-pulse-dot" aria-hidden="true" />
              <span>Live Art &amp; Motion Stream</span>
            </span>
            <span className="impulse-banner-copy">
              Click any still artwork or motion reel to load its prompt &amp; art direction
            </span>
          </div>

          <div className="impulse-banner-controls">
            <div className="impulse-filter-tabs" role="tablist" aria-label="Filter showcase feed">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'image', label: 'Art Stills' },
                  { id: 'video', label: 'Art Videos' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={feedFilter === tab.id}
                  className={`impulse-tab-btn ${feedFilter === tab.id ? 'is-active' : ''}`}
                  onClick={() => setFeedFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="subtle-chip-btn"
              onClick={() => setMarqueePaused((prev) => !prev)}
              aria-label={marqueePaused ? 'Resume animation' : 'Pause animation'}
              title={marqueePaused ? 'Resume showcase reel' : 'Pause showcase reel'}
            >
              {marqueePaused ? (
                <Play size={12} strokeWidth={2} />
              ) : (
                <Pause size={12} strokeWidth={2} />
              )}
              <span>{marqueePaused ? 'Play' : 'Live'}</span>
            </button>
          </div>
        </div>

        {isStreamLoading ? (
          <ImpulseReelSkeleton count={6} />
        ) : (
          <div className={`impulse-marquee-viewport ${marqueePaused ? 'is-paused' : ''}`}>
            <div className="impulse-marquee-track" key={feedFilter}>
              {[0, 1].map((loopCopy) => (
                <div
                  key={loopCopy}
                  className="impulse-marquee-half"
                  aria-hidden={loopCopy === 1}
                >
                  {marqueeLoopUnit.map((item, idx) => (
                    <button
                      key={`${loopCopy}-${item.id}-${idx}`}
                      type="button"
                      tabIndex={loopCopy === 1 ? -1 : 0}
                      className={`impulse-card ${
                        activeSpotlight.id === item.id && !shownCreation ? 'is-focused' : ''
                      }`}
                      onClick={() => applyInspiration(item)}
                    >
                      <div className="impulse-thumb">
                        <ProgressiveImage
                          src={item.src}
                          alt={item.title}
                          loading="eager"
                          className={`impulse-thumb-img ${item.kbClass}`}
                          style={{ objectPosition: item.objectPosition }}
                        />
                        <span
                          className={`impulse-kind-pill ${
                            item.category === 'image' ? 'is-image' : 'is-video'
                          }`}
                        >
                          {item.category === 'video' ? (
                            <span className="kinetic-eq is-light" aria-hidden="true">
                              <span />
                              <span />
                              <span />
                            </span>
                          ) : (
                            <ImageIcon size={10} strokeWidth={2.2} />
                          )}
                          <span>{item.category === 'image' ? 'STILL' : 'MOTION'}</span>
                        </span>
                      </div>

                      <div className="impulse-card-meta">
                        <span className="impulse-card-title">{item.title}</span>
                        <span className="impulse-card-sub">
                          {item.tag} · {item.aspectRatio}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="studio-card">
        <div className="studio-topbar">
          <div className="mode-switcher" role="tablist" aria-label="Creation format">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'image'}
              className={`mode-tab ${mode === 'image' ? 'is-active' : ''}`}
              onClick={() => handleModeSwitch('image')}
            >
              <span className={`mode-dot ${mode === 'image' ? 'is-image' : ''}`} />
              <ImageIcon size={14} strokeWidth={1.75} />
              <span>Image Generation</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'video'}
              className={`mode-tab ${mode === 'video' ? 'is-active' : ''}`}
              onClick={() => handleModeSwitch('video')}
            >
              <span className={`mode-dot ${mode === 'video' ? 'is-video' : ''}`} />
              <Film size={14} strokeWidth={1.75} />
              <span>Video Generation</span>
            </button>
          </div>

          <div className="studio-meta-bar">
            <select
              aria-label="Model selection"
              className="studio-select"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              {MODELS_BY_MODE[mode].map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} — {item.note}
                </option>
              ))}
            </select>

            <span className="adapter-status-pill">
              {import.meta.env.VITE_GENERATION_API_URL ? 'API: Connected' : 'Adapter: Ready'}
            </span>
          </div>
        </div>

        <div className="studio-grid">
          <div className="studio-composer">
            <div>
              <div className="field-label-row">
                <label htmlFor="studio-prompt-input" className="field-label">
                  Prompt Input
                </label>
                <span className="field-hint">Be descriptive for better results</span>
              </div>

              <div className="prompt-textarea-wrap">
                <textarea
                  ref={textareaRef}
                  id="studio-prompt-input"
                  className="prompt-textarea"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you want to create..."
                />

                <div className="prompt-toolbar">
                  <div className="prompt-toolbar-actions">
                    <input
                      ref={referenceInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="sr-only"
                      onChange={handleReferenceUpload}
                    />
                    <button
                      type="button"
                      className={`subtle-chip-btn ${referenceUrl ? 'is-active' : ''}`}
                      onClick={() => referenceInputRef.current?.click()}
                      disabled={uxState === 'uploading'}
                      title="Upload images or videos to guide your creation."
                    >
                      {uxState === 'uploading' ? (
                        <InlineSpinner size={12} />
                      ) : (
                        <Paperclip size={12} strokeWidth={1.75} />
                      )}
                      <span>
                        {uxState === 'uploading'
                          ? BRAND_CONFIG.uxStates.uploading
                          : referenceUrl
                            ? 'Replace reference'
                            : 'Reference assets'}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`subtle-chip-btn ${showNegative ? 'is-active' : ''}`}
                      onClick={() => setShowNegative((prev) => !prev)}
                    >
                      <Plus size={12} strokeWidth={1.75} />
                      <span>Exclude</span>
                    </button>

                    <button
                      type="button"
                      className={`subtle-chip-btn ${isEnhancing ? 'is-active' : ''}`}
                      onClick={() => void handleEnhancePrompt()}
                      disabled={!prompt.trim() || isEnhancing}
                      title="AI Prompt Enhancement"
                    >
                      {isEnhancing ? <InlineSpinner size={12} /> : <Sparkles size={12} strokeWidth={1.75} />}
                      <span>{isEnhancing ? 'Enhancing...' : enhancedSuccessMsg || 'Enhance Prompt'}</span>
                    </button>
                  </div>

                  {prompt && (
                    <button
                      type="button"
                      className="subtle-chip-btn"
                      onClick={() => setPrompt('')}
                    >
                      <RotateCcw size={12} strokeWidth={1.75} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-muted)' }}>
                Upload images or videos to guide your creation.
              </p>
            </div>

            {uxState === 'uploading' ? (
              <div className="reference-preview-bar is-uploading" aria-busy="true">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <SkeletonBlock className="reference-thumb" />
                  <SkeletonBlock className="skeleton-line" style={{ width: '48%', height: 12 }} />
                </div>
                <InlineSpinner size={13} />
              </div>
            ) : (
              referenceUrl &&
              referenceName && (
                <div className="reference-preview-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {referenceKind === 'video' ? (
                      <video src={referenceUrl} className="reference-thumb" muted playsInline />
                    ) : (
                      <div className="reference-thumb-wrap">
                        <ProgressiveImage
                          src={referenceUrl}
                          alt="Reference asset"
                          className="reference-thumb"
                          loading="eager"
                        />
                      </div>
                    )}
                    <span>Reference: {referenceName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearReference}
                    aria-label="Remove reference asset"
                    title="Remove reference"
                  >
                    <X size={14} strokeWidth={1.75} />
                  </button>
                </div>
              )
            )}

            {showNegative && (
              <div>
                <div className="field-label-row">
                  <label htmlFor="negative-prompt" className="field-label">
                    Exclude Elements
                  </label>
                  <span className="field-hint">Optional negative direction</span>
                </div>
                <input
                  id="negative-prompt"
                  type="text"
                  className="negative-input"
                  value={negativePrompt}
                  onChange={(event) => setNegativePrompt(event.target.value)}
                  placeholder="e.g. text overlays, harsh flash, lens flare"
                />
              </div>
            )}

            <div>
              <div className="field-label-row">
                <span className="control-label">Visual Prompt Starters</span>
                <span className="field-hint">Tap a study to apply</span>
              </div>
              {isStartersLoading ? (
                <PresetStartersSkeleton count={filteredPresets.length || 2} />
              ) : (
                <div className="preset-visual-grid">
                  {filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="preset-visual-pill"
                      onClick={() => {
                        setPrompt(preset.prompt);
                        setAspectRatio(preset.aspectRatio);
                        if (preset.style) setStyle(preset.style);
                        if (preset.motion) setMotion(preset.motion);
                      }}
                    >
                      {preset.thumbSrc && (
                        <span className="preset-visual-thumb-wrap">
                          <ProgressiveImage
                            src={preset.thumbSrc}
                            alt={preset.label}
                            loading="eager"
                            className="preset-visual-thumb"
                            style={{ objectPosition: preset.thumbPosition ?? 'center' }}
                          />
                        </span>
                      )}
                      <span className="preset-visual-meta">
                        <span className="preset-visual-title">{preset.label}</span>
                        {preset.subtitle && (
                          <span className="preset-visual-sub">{preset.subtitle}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="controls-grid">
              <div className="control-group">
                <span className="control-label">
                  Aspect Ratio · {currentRatioMeta?.dimensions[mode][resolution]}
                </span>
                <div className="option-pill-group">
                  {ASPECT_RATIOS.map((ratio) => {
                    const glyph = getRatioGlyphDimensions(ratio.value);
                    return (
                      <button
                        key={ratio.value}
                        type="button"
                        className={`option-pill ${aspectRatio === ratio.value ? 'is-selected' : ''}`}
                        onClick={() => setAspectRatio(ratio.value)}
                      >
                        <span
                          className="ratio-box"
                          style={{ width: glyph.width, height: glyph.height }}
                          aria-hidden="true"
                        />
                        <span>{ratio.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="control-group">
                <span className="control-label">Resolution</span>
                <div className="option-pill-group">
                  {RESOLUTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`option-pill ${resolution === item ? 'is-selected' : ''}`}
                      onClick={() => setResolution(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-group">
                <span className="control-label">Visual Style</span>
                <div className="option-pill-group">
                  {IMAGE_STYLES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`option-pill ${style === item ? 'is-selected' : ''}`}
                      onClick={() => setStyle(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'image' ? (
                <div className="control-group">
                  <span className="control-label">Number of Variations</span>
                  <div className="option-pill-group">
                    {VARIATION_COUNTS.map((count) => (
                      <button
                        key={count}
                        type="button"
                        className={`option-pill ${variations === count ? 'is-selected' : ''}`}
                        onClick={() => setVariations(count)}
                      >
                        {count} {count === 1 ? 'Frame' : 'Frames'}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="control-group">
                    <span className="control-label">Duration</span>
                    <div className="option-pill-group">
                      {VIDEO_DURATIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className={`option-pill ${duration === item ? 'is-selected' : ''}`}
                          onClick={() => setDuration(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group" style={{ gridColumn: '1 / -1' }}>
                    <span className="control-label">Camera Motion &amp; Frame Rate</span>
                    <div className="option-pill-group">
                      {VIDEO_MOTIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className={`option-pill ${motion === item ? 'is-selected' : ''}`}
                          onClick={() => setMotion(item)}
                        >
                          {item}
                        </button>
                      ))}
                      {VIDEO_FRAME_RATES.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className={`option-pill ${fps === item ? 'is-selected' : ''}`}
                          onClick={() => setFps(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="composer-footer">
              <span className="shortcut-hint">
                <span className="kbd">Ctrl</span>+<span className="kbd">Enter</span> to generate
              </span>

              <button
                type="button"
                className="btn-pill btn-primary"
                disabled={!prompt.trim() || isBusy}
                onClick={() => void handleGenerate()}
              >
                {isBusy ? <InlineSpinner size={14} /> : <Sparkles size={15} strokeWidth={1.85} />}
                <span>
                  {uxState === 'processing'
                    ? 'Processing...'
                    : isBusy
                      ? 'Generating...'
                      : 'Generate Creation'}
                </span>
              </button>
            </div>
          </div>

          <div className="studio-stage">
            <div className="stage-header">
              <span
                className={`stage-badge ${
                  shownCreation
                    ? activeMode === 'image'
                      ? 'is-image'
                      : 'is-video'
                    : activeSpotlight.category === 'image'
                      ? 'is-image'
                      : 'is-video'
                }`}
              >
                {!shownCreation && !isBusy && (
                  <span className="live-pulse-dot" aria-hidden="true" />
                )}
                {(shownCreation ? activeMode : activeSpotlight.category) === 'image' ? (
                  <ImageIcon size={12} strokeWidth={2} />
                ) : (
                  <Film size={12} strokeWidth={2} />
                )}
                <span>
                  {uxState === 'generating'
                    ? BRAND_CONFIG.uxStates.generating
                    : uxState === 'processing'
                      ? BRAND_CONFIG.uxStates.processing
                      : shownCreation
                        ? uxState === 'success'
                          ? BRAND_CONFIG.uxStates.success
                          : `${workflowLabel} · ${activeRatio}`
                        : `Visual Showcase · ${String(spotlightIdx + 1).padStart(2, '0')} / ${String(
                            STUDIO_INSPIRATION_REEL.length
                          ).padStart(2, '0')}`}
                </span>
              </span>

              {shownCreation ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="field-hint">
                    Seed #{activeSeed} · {shownCreation.dimensions}
                  </span>
                  <button
                    type="button"
                    className="subtle-chip-btn"
                    onClick={() => setStageShowcaseOverride(true)}
                  >
                    <Layers size={12} strokeWidth={1.75} />
                    <span>Gallery feed</span>
                  </button>
                </div>
              ) : (
                <div className="stage-cycle-controls">
                  <button
                    type="button"
                    className="stage-nav-btn"
                    onClick={() =>
                      setSpotlightIdx((prev) =>
                        prev === 0 ? STUDIO_INSPIRATION_REEL.length - 1 : prev - 1
                      )
                    }
                    aria-label="Previous showcase"
                  >
                    <ChevronLeft size={14} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="stage-nav-btn"
                    onClick={() => setSpotlightPaused((prev) => !prev)}
                    aria-label={spotlightPaused ? 'Resume slideshow' : 'Pause slideshow'}
                  >
                    {spotlightPaused ? (
                      <Play size={12} strokeWidth={2} />
                    ) : (
                      <Pause size={12} strokeWidth={2} />
                    )}
                  </button>
                  <button
                    type="button"
                    className="stage-nav-btn"
                    onClick={() =>
                      setSpotlightIdx((prev) => (prev + 1) % STUDIO_INSPIRATION_REEL.length)
                    }
                    aria-label="Next showcase"
                  >
                    <ChevronRight size={14} strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>

            <div className="stage-frame-viewport">
              {!isBusy && shownCreation && variationCount > 1 ? (
                <div className="variation-grid" role="radiogroup" aria-label="Generated image variations">
                  {Array.from({ length: variationCount }, (_, idx) => {
                    const isSelected = selectedVariationIdx === idx;
                    const frameSeed = shownCreation.seed + idx;
                    const variantAsset = pickStudioVariationAsset(
                      shownCreation.mediaUrl,
                      idx,
                      shownCreation.seed
                    );
                    const variantSrc =
                      idx === 0 && shownCreation.mediaUrl ? shownCreation.mediaUrl : variantAsset.src;

                    return (
                      <button
                        key={frameSeed}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        className={`variation-tile ${getRatioClass(activeRatio)} ${
                          isSelected ? 'is-selected' : ''
                        }`}
                        onClick={() => setSelectedVariationIdx(idx)}
                      >
                        <div className="variation-tile-media">
                          <ProgressiveImage
                            src={variantSrc}
                            alt={`${shownCreation.title} variation ${idx + 1}`}
                            loading="eager"
                            style={{ objectPosition: variantAsset.objectPosition }}
                          />
                        </div>
                        <div className="stage-blueprint-top">
                          <span>VAR 0{idx + 1}</span>
                          <span>#{frameSeed}</span>
                        </div>
                        <h4 className="variation-tile-title" style={{ marginBottom: 0 }}>
                          {shownCreation.title}
                        </h4>
                        <div className="stage-blueprint-meta">
                          <span className="stage-meta-tag">{shownCreation.request.style}</span>
                          <span className="stage-meta-tag">{shownCreation.request.resolution}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : isBusy && progress ? (
                mode === 'image' && variations > 1 ? (
                  <div
                    className="variation-grid"
                    aria-busy="true"
                    aria-label="Generating image variations"
                  >
                    {Array.from({ length: variations }, (_, idx) => (
                      <div
                        key={idx}
                        className={`variation-tile is-skeleton ${getRatioClass(aspectRatio)}`}
                      >
                        <div className="stage-blueprint-top">
                          <span>VAR 0{idx + 1}</span>
                          <span>{progress.progress}%</span>
                        </div>
                        <div
                          className="stage-blueprint-center"
                          style={{
                            padding: '8px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          <SkeletonBlock
                            className="skeleton-line"
                            style={{ width: '100%', height: 52, borderRadius: 8 }}
                          />
                          <InlineSpinner size={15} />
                          <SkeletonBlock className="skeleton-line" style={{ width: '74%', height: 11 }} />
                          <SkeletonBlock className="skeleton-line" style={{ width: '56%', height: 10 }} />
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill is-image"
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="stage-frame-box" style={{ maxWidth: getStageMaxWidth(aspectRatio) }}>
                    <div
                      className={`stage-frame-inner is-generating-stage ${getRatioClass(aspectRatio)}`}
                      aria-busy="true"
                    >
                      <div className="stage-blueprint-top">
                        <span>{progress.phase === 'generating' ? 'STAGE 01' : 'STAGE 02'}</span>
                        <span>{progress.progress}%</span>
                      </div>

                      <div className="stage-skeleton-canvas-wrap">
                        <SkeletonBlock
                          className="skeleton-fill"
                          style={{ position: 'absolute', inset: 0 }}
                        />
                        <div className="stage-orbit-loader" aria-hidden="true">
                          <span className="orbit-ring outer" />
                          <span className="orbit-ring inner" />
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <h3 className="stage-blueprint-title" style={{ marginBottom: 4 }}>
                          {progress.phase === 'generating'
                            ? BRAND_CONFIG.uxStates.generating
                            : BRAND_CONFIG.uxStates.processing}
                        </h3>
                        <div className="stage-skeleton-stack" aria-hidden="true">
                          <SkeletonBlock className="skeleton-line" style={{ width: '74%', height: 9 }} />
                          <SkeletonBlock className="skeleton-line" style={{ width: '52%', height: 9 }} />
                        </div>
                      </div>

                      <div>
                        <div className="stage-skeleton-pills" style={{ marginBottom: 7 }} aria-hidden="true">
                          <SkeletonBlock className="skeleton-pill" style={{ width: 64, height: 17 }} />
                          <SkeletonBlock className="skeleton-pill" style={{ width: 78, height: 17 }} />
                        </div>
                        <div className="progress-track">
                          <div
                            className={`progress-fill ${mode === 'image' ? 'is-image' : 'is-video'}`}
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : shownCreation ? (() => {
                const matchedFallback = pickStudioAssetForPrompt(
                  shownCreation.request.prompt,
                  shownCreation.seed
                );
                const resolvedMediaUrl = shownCreation.mediaUrl ?? matchedFallback.src;
                const playableVideo = isPlayableVideoUrl(resolvedMediaUrl);
                const isMotionKeyframe = shownCreation.mediaKind === 'video' && !playableVideo;

                return (
                <div className="stage-frame-box" style={{ maxWidth: getStageMaxWidth(activeRatio) }}>
                  <div className={`stage-frame-inner has-media ${getRatioClass(activeRatio)}`}>
                    {playableVideo ? (
                      <video
                        className="media-frame-asset"
                        src={resolvedMediaUrl}
                        controls
                        autoPlay
                        loop
                        muted
                      />
                    ) : (
                      <ProgressiveImage
                        className={`media-frame-asset ${isMotionKeyframe ? 'is-kb-pan' : ''}`.trim()}
                        src={resolvedMediaUrl}
                        alt={shownCreation.title}
                        loading="eager"
                        style={
                          !shownCreation.mediaUrl
                            ? { objectPosition: matchedFallback.objectPosition }
                            : undefined
                        }
                      />
                    )}

                    {isMotionKeyframe && (
                      <span className="frame-motion-indicator" aria-hidden="true">
                        <span className="kinetic-eq">
                          <span />
                          <span />
                          <span />
                        </span>
                        <span>
                          {shownCreation.request.motion ?? 'MOTION'} ·{' '}
                          {shownCreation.request.fps ?? '24 fps'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                );
              })() : isSpotlightLoading ? (
                <SpotlightStageSkeleton />
              ) : (
                <div className="stage-spotlight-shell">
                  <div
                    className="stage-spotlight-card"
                    onMouseEnter={() => setSpotlightPaused(true)}
                    onMouseLeave={() => setSpotlightPaused(false)}
                  >
                    <div className="stage-spotlight-media">
                      <div key={activeSpotlight.id} className="stage-spotlight-frame">
                        <ProgressiveImage
                          src={activeSpotlight.src}
                          alt={activeSpotlight.title}
                          loading="eager"
                          className={`stage-spotlight-img ${activeSpotlight.kbClass}`}
                          style={{ objectPosition: activeSpotlight.objectPosition }}
                        />
                      </div>

                      <div className="stage-spotlight-overlay-top">
                        <span
                          className={`stage-chip-frosted ${
                            activeSpotlight.category === 'image' ? 'is-image' : 'is-video'
                          }`}
                        >
                          {activeSpotlight.category === 'video' ? (
                            <span className="kinetic-eq" aria-hidden="true">
                              <span />
                              <span />
                              <span />
                            </span>
                          ) : (
                            <ImageIcon size={11} strokeWidth={2} />
                          )}
                          <span>
                            {activeSpotlight.category === 'video'
                              ? `${activeSpotlight.motion} · 00:0${videoTick} / 00:08`
                              : activeSpotlight.tag}
                          </span>
                        </span>

                        <span className="stage-chip-frosted">
                          {aspectRatio} · {currentRatioMeta?.dimensions[mode][resolution]}
                        </span>
                      </div>
                    </div>

                    <div className="stage-spotlight-dock">
                      <div className="stage-spotlight-copy">
                        <strong className="stage-spotlight-title">{activeSpotlight.title}</strong>
                        <p className="stage-spotlight-prompt">{activeSpotlight.prompt}</p>
                      </div>

                      <button
                        type="button"
                        className="btn-pill btn-pill-sm btn-cobalt"
                        onClick={() => applyInspiration(activeSpotlight)}
                      >
                        <span>Load Prompt</span>
                        <ArrowRight size={13} strokeWidth={2} />
                      </button>
                    </div>

                    <div className="spotlight-cycle-track" aria-hidden="true">
                      <div
                        key={`${activeSpotlight.id}-${spotlightPaused ? 'p' : 'r'}`}
                        className={`spotlight-cycle-fill ${spotlightPaused ? 'is-paused' : ''} ${
                          activeSpotlight.category === 'video' ? 'is-video' : 'is-image'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="stage-thumb-rail" aria-label="Featured studio artworks">
                    {STUDIO_INSPIRATION_REEL.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`stage-thumb-btn ${idx === spotlightIdx ? 'is-active' : ''}`}
                        onClick={() => {
                          setSpotlightIdx(idx);
                          setVideoTick(1);
                        }}
                        title={item.title}
                        aria-label={`Preview ${item.title}`}
                      >
                        <ProgressiveImage
                          src={item.src}
                          alt={item.title}
                          loading="eager"
                          style={{ objectPosition: item.objectPosition }}
                        />
                        <span
                          className={`stage-thumb-dot ${
                            item.category === 'image' ? 'is-image' : 'is-video'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {shownCreation && (
              <div>
                <div className="stage-footer-actions">
                  <div className="prompt-toolbar-actions">
                    <button
                      type="button"
                      className="subtle-chip-btn"
                      onClick={() => onPreviewCreation(shownCreation)}
                    >
                      <Eye size={12} strokeWidth={1.75} />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      className={`subtle-chip-btn ${shownCreation.saved ? 'is-active' : ''}`}
                      onClick={() => onToggleSave(shownCreation.id)}
                    >
                      <Bookmark size={12} strokeWidth={1.75} />
                      <span>{shownCreation.saved ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      type="button"
                      className="subtle-chip-btn"
                      onClick={() => onDownloadCreation(shownCreation)}
                    >
                      <Download size={12} strokeWidth={1.75} />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      className={`subtle-chip-btn ${showPayload ? 'is-active' : ''}`}
                      onClick={() => setShowPayload((prev) => !prev)}
                    >
                      <Code2 size={12} strokeWidth={1.75} />
                      <span>Payload</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="subtle-chip-btn"
                    onClick={() =>
                      void handleCopyPrompt(shownCreation.request.prompt, shownCreation.id)
                    }
                  >
                    {copiedId === shownCreation.id ? (
                      <>
                        <Check size={12} strokeWidth={2} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} strokeWidth={1.75} />
                        <span>Copy prompt</span>
                      </>
                    )}
                  </button>
                </div>

                {showPayload && (
                  <pre className="payload-drawer">
                    {JSON.stringify(
                      {
                        model: shownCreation.request.model,
                        mode: shownCreation.request.mode,
                        prompt: shownCreation.request.prompt,
                        aspectRatio: shownCreation.request.aspectRatio,
                        resolution: shownCreation.request.resolution,
                        style: shownCreation.request.style,
                        ...(shownCreation.request.mode === 'image'
                          ? { variations: shownCreation.request.variations }
                          : {
                              duration: shownCreation.request.duration,
                              motion: shownCreation.request.motion,
                              fps: shownCreation.request.fps,
                            }),
                        seed: shownCreation.seed,
                      },
                      null,
                      2
                    )}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {creations.length > 0 && (
        <div className="history-strip">
          <div className="history-header">
            <span className="history-title">Generation History ({creations.length})</span>
            <button type="button" className="subtle-chip-btn" onClick={onClearHistory}>
              <Trash2 size={12} strokeWidth={1.75} />
              <span>Clear</span>
            </button>
          </div>

          <div className="history-grid">
            {creations.map((item) => {
              const thumbFallback = pickStudioAssetForPrompt(item.request.prompt, item.seed);
              const thumbSrc = item.mediaUrl ?? thumbFallback.src;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`history-item ${activeCreation?.id === item.id ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedCreationId(item.id);
                    setSelectedVariationIdx(0);
                    setStageShowcaseOverride(false);
                  }}
                >
                  <div className="history-item-row">
                    <div className="history-item-thumb">
                      <ProgressiveImage
                        src={thumbSrc}
                        alt={item.title}
                        loading="eager"
                        style={
                          !item.mediaUrl
                            ? { objectPosition: thumbFallback.objectPosition }
                            : undefined
                        }
                      />
                    </div>
                    <div className="history-item-content">
                      <div className="history-item-top">
                        <span>
                          {item.mediaKind.toUpperCase()} · {item.request.aspectRatio}
                        </span>
                        <span>{item.createdAt}</span>
                      </div>
                      <strong className="history-item-title">{item.title}</strong>
                      <p className="history-item-prompt">{item.request.prompt}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

