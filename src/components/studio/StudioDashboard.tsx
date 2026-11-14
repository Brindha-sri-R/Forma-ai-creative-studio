import { useState } from 'react';
import { ArrowUpRight, Film, Image as ImageIcon, Plus } from 'lucide-react';
import { STUDIO_ASSETS, isPlayableVideoUrl, pickStudioAssetForPrompt } from '../../data/assets';
import type { AspectRatio, CreationItem, GenerationMode } from '../../types/studio';
import { ProgressiveImage, WorkspaceGridSkeleton, useSkeletonTransition } from '../MinimalLoaders';

export interface WorkspaceTemplateSeed {
  id: string;
  title: string;
  meta: string;
  badge: string;
  mode: GenerationMode;
  aspectRatio: AspectRatio;
  prompt?: string;
  thumbnailSrc: string;
  objectPosition?: string;
}

const WORKSPACE_STARTERS: WorkspaceTemplateSeed[] = [
  {
    id: 'starter-macaw',
    title: 'Botanical Macaw Study',
    meta: 'Starter · 4:5 Image',
    badge: 'Image',
    mode: 'image',
    aspectRatio: '4:5',
    thumbnailSrc: STUDIO_ASSETS.img1.src,
    objectPosition: STUDIO_ASSETS.img1.objectPosition,
    prompt:
      'Surreal editorial paper-cut collage featuring monochrome profile portrait, turquoise sky backdrop, peach solar disc, and perched blue-gold macaw',
  },
  {
    id: 'starter-banana-hound',
    title: 'Banana Hound Study',
    meta: 'Pop Still · 1:1 Image',
    badge: 'Image',
    mode: 'image',
    aspectRatio: '1:1',
    thumbnailSrc: STUDIO_ASSETS.img6.src,
    objectPosition: STUDIO_ASSETS.img6.objectPosition,
    prompt:
      'Warm painterly digital illustration of a serene cream dog wearing a peeled yellow banana crown against a deep charcoal textured ground',
  },
  {
    id: 'starter-cobra-motion',
    title: 'Crimson Cobra Motion',
    meta: 'Video timeline · 24fps',
    badge: 'Video',
    mode: 'video',
    aspectRatio: '9:16',
    thumbnailSrc: STUDIO_ASSETS.img3.src,
    objectPosition: STUDIO_ASSETS.img3.objectPosition,
    prompt:
      'Controlled arc orbit around a masked folk performer in crimson embroidered attire and fanned serpent crown against a pitch-black cyclorama, 24fps',
  },
  {
    id: 'starter-ritual',
    title: 'Vermilion Guardian',
    meta: 'Starter · 4:5 Image',
    badge: 'Image',
    mode: 'image',
    aspectRatio: '4:5',
    thumbnailSrc: STUDIO_ASSETS.img4.src,
    objectPosition: STUDIO_ASSETS.img4.objectPosition,
    prompt:
      'Bold graphic comic illustration of a ritual figure in a towering concentric crimson headdress with flowing ceremonial ribbons on burnt umber mandala pattern',
  },
  {
    id: 'starter-alpine',
    title: 'Alpine Tarn Concept',
    meta: 'Starter · 9:16 Image',
    badge: 'Image',
    mode: 'image',
    aspectRatio: '9:16',
    thumbnailSrc: STUDIO_ASSETS.img8.src,
    objectPosition: STUDIO_ASSETS.img8.objectPosition,
    prompt:
      'Ligne-claire alpine fantasy illustration of a mossy stone giant hand cradling a mirror-still mountain pool with white birds and a cloaked traveler',
  },
  {
    id: 'starter-dune-pan',
    title: 'Crimson Moon Dolly',
    meta: 'Preset · 30fps Camera Pan',
    badge: 'Video',
    mode: 'video',
    aspectRatio: '16:9',
    thumbnailSrc: STUDIO_ASSETS.img7.src,
    objectPosition: STUDIO_ASSETS.img7.objectPosition,
    prompt:
      'Sweeping lateral pan across an iron-red planetary desert scattered with volcanic boulders under an oversized crescent moon, 30fps filmic motion',
  },
  {
    id: 'starter-coastal',
    title: 'Coastal Horizon',
    meta: 'Starter · 4:5 Image',
    badge: 'Image',
    mode: 'image',
    aspectRatio: '4:5',
    thumbnailSrc: STUDIO_ASSETS.img2.src,
    objectPosition: STUDIO_ASSETS.img2.objectPosition,
    prompt:
      'Detailed crosshatched editorial illustration of a coastal villager facing the ocean swell surrounded by soaring seagulls and cumulus clouds',
  },
  {
    id: 'starter-greyhound',
    title: 'Scale & Twilight',
    meta: 'Starter · 4:5 Image',
    badge: 'Image',
    mode: 'image',
    aspectRatio: '4:5',
    thumbnailSrc: STUDIO_ASSETS.img5.src,
    objectPosition: STUDIO_ASSETS.img5.objectPosition,
    prompt:
      'Surrealist scale painting of a young man in a mustard tailored suit resting calmly against a colossal greyhound silhouette under twilight rim light',
  },
];

interface StudioDashboardProps {
  credits: number;
  creations: CreationItem[];
  searchQuery: string;
  onStartMode: (mode: GenerationMode) => void;
  onLaunchStarter: (starter: WorkspaceTemplateSeed) => void;
  onPreviewCreation: (item: CreationItem) => void;
}

export function StudioDashboard({
  creations,
  searchQuery,
  onStartMode,
  onLaunchStarter,
  onPreviewCreation,
}: StudioDashboardProps) {
  const [formatFilter, setFormatFilter] = useState<'all' | GenerationMode>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');
  const isGridLoading = useSkeletonTransition(
    `${formatFilter}:${sortBy}:${searchQuery.trim().toLowerCase()}`,
    360
  );

  const handleFormatChange = (next: 'all' | GenerationMode) => {
    if (next === formatFilter) return;
    setFormatFilter(next);
  };

  const handleSortChange = (next: 'recent' | 'alpha') => {
    if (next === sortBy) return;
    setSortBy(next);
  };

  const query = searchQuery.trim().toLowerCase();

  const filteredCreations = creations
    .filter((item) => {
      if (formatFilter !== 'all' && item.mediaKind !== formatFilter) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.request.prompt.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => (sortBy === 'alpha' ? a.title.localeCompare(b.title) : 0));

  const filteredStarters = WORKSPACE_STARTERS.filter((item) => {
    if (formatFilter !== 'all' && item.mode !== formatFilter) return false;
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query) ||
      (item.prompt?.toLowerCase().includes(query) ?? false)
    );
  }).sort((a, b) => (sortBy === 'alpha' ? a.title.localeCompare(b.title) : 0));

  const headingTitle =
    formatFilter === 'all' ? 'All' : formatFilter === 'image' ? 'Images' : 'Videos';

  return (
    <div className="workspace-canvas-inner">
      <div className="workspace-top-row">
        <div className="workspace-heading-group">
          <h1 className="workspace-heading">{headingTitle}</h1>

          <div className="workspace-format-pills" role="tablist" aria-label="Filter format">
            {(['all', 'image', 'video'] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={formatFilter === key}
                className={`workspace-format-pill ${formatFilter === key ? 'is-active' : ''}`}
                onClick={() => handleFormatChange(key)}
              >
                {key === 'all' ? 'All' : key === 'image' ? 'Images' : 'Videos'}
              </button>
            ))}
          </div>
        </div>

        <div className="workspace-top-actions">
          <select
            className="workspace-sort-select"
            aria-label="Sort creations"
            value={sortBy}
            onChange={(event) => handleSortChange(event.target.value as 'recent' | 'alpha')}
          >
            <option value="recent">Last viewed by me</option>
            <option value="alpha">Name A–Z</option>
          </select>

          <button
            type="button"
            className="workspace-secondary-btn"
            onClick={() => onStartMode('video')}
          >
            <Film size={14} strokeWidth={1.85} />
            <span>New video</span>
          </button>

          <button
            type="button"
            className="workspace-cobalt-btn"
            onClick={() => onStartMode('image')}
          >
            <Plus size={14} strokeWidth={2.2} />
            <span>New creation</span>
          </button>
        </div>
      </div>

      {isGridLoading ? (
        <WorkspaceGridSkeleton count={8} />
      ) : filteredCreations.length === 0 && filteredStarters.length === 0 ? (
        <div className="studio-card empty-state-card" style={{ marginTop: 12 }}>
          <div className="frame-empty-icon" style={{ width: 40, height: 40, margin: '0 auto 12px' }}>
            <ImageIcon size={17} strokeWidth={1.75} />
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>No matching projects</h2>
          <p className="section-subtitle" style={{ margin: '6px auto 18px', textAlign: 'center' }}>
            Try another keyword or start a fresh image or video generation.
          </p>
          <button
            type="button"
            className="workspace-cobalt-btn"
            onClick={() => onStartMode('image')}
          >
            <Plus size={14} strokeWidth={2.2} />
            <span>New creation</span>
          </button>
        </div>
      ) : (
        <div className="workspace-project-grid">
          {filteredCreations.map((item) => {
            const matchedFallback = pickStudioAssetForPrompt(item.request.prompt, item.seed);
            const mediaSrc = item.mediaUrl ?? matchedFallback.src;
            const playableVideo = isPlayableVideoUrl(mediaSrc);

            return (
              <button
                key={item.id}
                type="button"
                className="workspace-card"
                onClick={() => onPreviewCreation(item)}
              >
                <div className="workspace-card-thumb">
                  {playableVideo ? (
                    <video src={mediaSrc} muted loop playsInline />
                  ) : (
                    <ProgressiveImage
                      src={mediaSrc}
                      alt={item.title}
                      className={item.mediaKind === 'video' ? 'is-kb-pan' : undefined}
                      style={!item.mediaUrl ? { objectPosition: matchedFallback.objectPosition } : undefined}
                    />
                  )}

                  <span className="workspace-card-hover-pill">
                    <span>Preview</span>
                    <ArrowUpRight size={12} strokeWidth={2} />
                  </span>
                </div>

                <div className="workspace-card-foot">
                  <div className="workspace-card-title-row">
                    <span className="workspace-card-title">{item.title}</span>
                    <span className="workspace-card-badge">
                      {item.mediaKind === 'image' ? 'Image' : 'Video'}
                    </span>
                  </div>
                  <div className="workspace-card-meta">
                    Created {item.createdAt} · {item.request.resolution}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredStarters.map((starter) => (
            <button
              key={starter.id}
              type="button"
              className="workspace-card"
              onClick={() => onLaunchStarter(starter)}
            >
              <div className="workspace-card-thumb">
                <ProgressiveImage
                  src={starter.thumbnailSrc}
                  alt={starter.title}
                  className={starter.mode === 'video' ? 'is-kb-pan' : undefined}
                  style={
                    starter.objectPosition ? { objectPosition: starter.objectPosition } : undefined
                  }
                />

                <span className="workspace-card-hover-pill">
                  <span>{starter.mode === 'image' ? 'Open Image' : 'Open Video'}</span>
                  <ArrowUpRight size={12} strokeWidth={2} />
                </span>
              </div>

              <div className="workspace-card-foot">
                <div className="workspace-card-title-row">
                  <span className="workspace-card-title">{starter.title}</span>
                  <span className="workspace-card-badge">{starter.badge}</span>
                </div>
                <div className="workspace-card-meta">{starter.meta}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

