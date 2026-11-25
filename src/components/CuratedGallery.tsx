import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Eye, Film, Image as ImageIcon } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';
import type { AssetSlot, ExploreFilter } from '../types/studio';
import { MediaFrame } from './MediaFrame';
import { GalleryGridSkeleton, useSkeletonTransition } from './MinimalLoaders';

interface CuratedGalleryProps {
  gallerySlots: AssetSlot[];
  variant?: 'public' | 'studio';
  onUsePrompt: (slot: AssetSlot) => void;
  onViewCreation: (slot: AssetSlot) => void;
  onExploreAll?: () => void;
}

const FILTER_TABS: { key: ExploreFilter; label: string }[] = [
  { key: 'all', label: 'All Creations' },
  { key: 'image', label: 'Images' },
  { key: 'video', label: 'Videos' },
  { key: 'trending', label: 'Trending' },
  { key: 'recent', label: 'Recently Added' },
];

export function CuratedGallery({
  gallerySlots,
  variant = 'public',
  onUsePrompt,
  onViewCreation,
  onExploreAll,
}: CuratedGalleryProps) {
  const [filter, setFilter] = useState<ExploreFilter>('all');
  const isSettling = useSkeletonTransition(`${variant}:${filter}`, 360, variant === 'public');

  const handleFilterChange = (next: ExploreFilter) => {
    if (next === filter) return;
    setFilter(next);
  };

  const visibleSlots = gallerySlots.filter((slot) => {
    if (filter === 'all') return true;
    if (filter === 'image' || filter === 'video') return slot.mediaKind === filter;
    return slot.tags?.includes(filter) ?? false;
  });

  const heading =
    variant === 'public' ? BRAND_CONFIG.sections.showcase.title : "Discover What's Possible.";
  const subtitle =
    variant === 'public'
      ? BRAND_CONFIG.sections.showcase.subtitle
      : 'Explore AI-generated visuals, creative styles, and inspiring ideas.';

  return (
    <section
      id={variant === 'public' ? 'explore' : undefined}
      className={variant === 'public' ? 'section-block' : 'studio-subview'}
    >
      <div className={variant === 'public' ? 'container' : undefined}>
        <div className="section-header">
          <div>
            <div className="section-eyebrow">
              {variant === 'public' ? BRAND_CONFIG.sections.showcase.eyebrow : 'Explore'}
            </div>
            <h2 className="section-title">{heading}</h2>
            <p className="section-subtitle">{subtitle}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="filter-pills" role="tablist" aria-label="Filter creations">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.key}
                  className={`filter-pill ${filter === tab.key ? 'is-active' : ''}`}
                  onClick={() => handleFilterChange(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isSettling ? (
          <GalleryGridSkeleton count={visibleSlots.length || 6} aspectClass="ratio-4-5" />
        ) : visibleSlots.length === 0 ? (
          <div className="studio-card empty-state-card" style={{ padding: '36px 20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-muted)' }}>
              No creations found in this category.
            </p>
            <button
              type="button"
              className="btn-pill btn-pill-sm btn-secondary"
              style={{ marginTop: 14 }}
              onClick={() => setFilter('all')}
            >
              Show All Creations
            </button>
          </div>
        ) : (
          <div className="gallery-grid">
          {visibleSlots.map((slot) => (
            <article key={slot.id} className="gallery-card">
              <MediaFrame
                slot={slot}
                variant="gallery"
                aspectClass="ratio-4-5"
              />

              <div className="gallery-card-meta">
                <div>
                  <h3 className="gallery-card-title">{slot.title}</h3>
                  <p className="gallery-card-prompt">{slot.prompt}</p>
                </div>
              </div>

              <div className="gallery-card-actions">
                <span
                  className={`gallery-tag ${slot.mediaKind === 'image' ? 'is-image' : 'is-video'}`}
                >
                  {slot.mediaKind === 'image' ? (
                    <ImageIcon size={11} strokeWidth={2} />
                  ) : (
                    <Film size={11} strokeWidth={2} />
                  )}
                  <span>
                    {slot.mediaKind === 'image' ? 'Image' : 'Video'} · {slot.aspectRatio}
                  </span>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    className="text-action-link"
                    onClick={() => onViewCreation(slot)}
                  >
                    <Eye size={13} strokeWidth={1.85} />
                    <span>View Creation</span>
                  </button>

                  <button
                    type="button"
                    className="text-action-link"
                    onClick={() => onUsePrompt(slot)}
                  >
                    <span>Use prompt</span>
                    <ArrowUpRight size={13} strokeWidth={1.85} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}

        {variant === 'public' && onExploreAll && (
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
            <button type="button" className="btn-pill btn-outline" onClick={onExploreAll}>
              <span>{BRAND_CONFIG.sections.showcase.cta}</span>
              <ArrowRight size={15} strokeWidth={1.85} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
