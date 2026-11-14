import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface InlineSpinnerProps {
  size?: number;
  className?: string;
}

/** Crisp single-stroke circular spinner inheriting current text color. */
export function InlineSpinner({ size = 14, className = '' }: InlineSpinnerProps) {
  return (
    <span
      className={`minimal-spinner ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

interface SkeletonBlockProps {
  className?: string;
  style?: CSSProperties;
}

export function SkeletonBlock({ className = '', style }: SkeletonBlockProps) {
  return <span className={`minimal-skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

/**
 * Triggers a clean transient skeleton loading window on mount and/or key transitions.
 */
export function useSkeletonTransition(
  triggerKey: string | number,
  durationMs = 360,
  skipInitial = false
): boolean {
  const [isLoading, setIsLoading] = useState(!skipInitial);
  const prevKeyRef = useRef(triggerKey);

  useEffect(() => {
    if (skipInitial && prevKeyRef.current === triggerKey) {
      return;
    }
    prevKeyRef.current = triggerKey;
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [triggerKey, durationMs, skipInitial]);

  return isLoading;
}

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: 'lazy' | 'eager';
}

/**
 * Displays a flat animated skeleton fill until the image decodes cleanly.
 */
export function ProgressiveImage({
  src,
  alt,
  className = '',
  style,
  loading = 'lazy',
}: ProgressiveImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
  }, [src]);

  return (
    <>
      {!loaded && <span className="minimal-skeleton media-skeleton-overlay" aria-hidden="true" />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        className={`${className} progressive-img ${loaded ? 'is-loaded' : 'is-loading'}`.trim()}
        style={style}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </>
  );
}

export function WorkspaceGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="workspace-project-grid" aria-busy="true" aria-label="Loading workspace cards">
      {Array.from({ length: count }, (_, idx) => (
        <div key={idx} className="workspace-card is-skeleton">
          <div className="workspace-card-thumb">
            <SkeletonBlock className="skeleton-fill" />
          </div>
          <div className="workspace-card-foot">
            <div className="workspace-card-title-row">
              <SkeletonBlock className="skeleton-line" style={{ width: '62%', height: 13 }} />
              <SkeletonBlock className="skeleton-pill" style={{ width: 42, height: 18 }} />
            </div>
            <SkeletonBlock className="skeleton-line" style={{ width: '48%', height: 11, marginTop: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GalleryGridSkeleton({
  count = 6,
  aspectClass = 'ratio-4-3',
}: {
  count?: number;
  aspectClass?: 'ratio-4-3' | 'ratio-4-5';
}) {
  return (
    <div className="gallery-grid" aria-busy="true" aria-label="Loading creations">
      {Array.from({ length: count }, (_, idx) => (
        <div key={idx} className="creation-library-card is-skeleton">
          <div className="media-frame">
            <div className={`media-frame-inner ${aspectClass}`}>
              <SkeletonBlock className="skeleton-fill" />
            </div>
          </div>
          <div style={{ padding: '6px 2px 2px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <SkeletonBlock className="skeleton-line" style={{ width: '58%', height: 14 }} />
              <SkeletonBlock className="skeleton-pill" style={{ width: 44, height: 18 }} />
            </div>
            <SkeletonBlock className="skeleton-line" style={{ width: '88%', height: 11 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ImpulseReelSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="impulse-marquee-viewport" aria-busy="true" aria-label="Loading showcase stream">
      <div className="impulse-skeleton-row">
        {Array.from({ length: count }, (_, idx) => (
          <div key={idx} className="impulse-card is-skeleton">
            <div className="impulse-thumb">
              <SkeletonBlock className="skeleton-fill" />
            </div>
            <div className="impulse-card-meta" style={{ gap: 5 }}>
              <SkeletonBlock className="skeleton-line" style={{ width: '74%', height: 12 }} />
              <SkeletonBlock className="skeleton-line" style={{ width: '52%', height: 10 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PresetStartersSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="preset-visual-grid" aria-busy="true" aria-label="Loading prompt starters">
      {Array.from({ length: count }, (_, idx) => (
        <div key={idx} className="preset-visual-pill is-skeleton">
          <SkeletonBlock className="preset-visual-thumb" />
          <div className="preset-visual-meta" style={{ flex: 1, gap: 5 }}>
            <SkeletonBlock className="skeleton-line" style={{ width: '68%', height: 12 }} />
            <SkeletonBlock className="skeleton-line" style={{ width: '48%', height: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SpotlightStageSkeleton() {
  return (
    <div className="stage-spotlight-shell" aria-busy="true" aria-label="Loading featured stage">
      <div className="stage-spotlight-card is-skeleton">
        <div className="stage-spotlight-media">
          <SkeletonBlock className="skeleton-fill" />
          <div className="stage-spotlight-overlay-top">
            <SkeletonBlock className="skeleton-pill" style={{ width: 92, height: 24 }} />
            <SkeletonBlock className="skeleton-pill" style={{ width: 76, height: 24 }} />
          </div>
        </div>
        <div className="stage-spotlight-dock">
          <div className="stage-spotlight-copy" style={{ flex: 1, gap: 6 }}>
            <SkeletonBlock className="skeleton-line" style={{ width: '52%', height: 13 }} />
            <SkeletonBlock className="skeleton-line" style={{ width: '86%', height: 11 }} />
          </div>
          <SkeletonBlock className="skeleton-pill" style={{ width: 96, height: 30, flexShrink: 0 }} />
        </div>
      </div>

      <div className="stage-thumb-rail">
        {Array.from({ length: 8 }, (_, idx) => (
          <div key={idx} className="stage-thumb-btn is-skeleton">
            <SkeletonBlock className="skeleton-fill" style={{ borderRadius: 5 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CreditsPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading plans and credits">
      <div className="pricing-grid-3" style={{ marginBottom: 28 }}>
        {Array.from({ length: 3 }, (_, idx) => (
          <div key={idx} className="pricing-card is-skeleton">
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="pricing-card-head">
                <SkeletonBlock className="skeleton-line" style={{ width: 72, height: 12 }} />
                <SkeletonBlock className="skeleton-pill" style={{ width: 68, height: 22 }} />
              </div>
              <SkeletonBlock className="skeleton-line" style={{ width: 120, height: 34 }} />
              <SkeletonBlock className="skeleton-line" style={{ width: '90%', height: 13 }} />
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <SkeletonBlock className="skeleton-line" style={{ width: '82%', height: 12 }} />
              <SkeletonBlock className="skeleton-line" style={{ width: '74%', height: 12 }} />
              <SkeletonBlock className="skeleton-line" style={{ width: '86%', height: 12 }} />
            </div>

            <SkeletonBlock className="skeleton-pill" style={{ width: '100%', height: 42 }} />
          </div>
        ))}
      </div>

      <div className="studio-card" style={{ padding: 24 }}>
        <div className="history-header">
          <SkeletonBlock className="skeleton-line" style={{ width: 110, height: 14 }} />
          <SkeletonBlock className="skeleton-line" style={{ width: 58, height: 12 }} />
        </div>
        <div className="asset-slot-list">
          {Array.from({ length: 3 }, (_, idx) => (
            <div key={idx} className="asset-slot-row is-skeleton">
              <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                <SkeletonBlock className="skeleton-line" style={{ width: '42%', height: 13 }} />
                <SkeletonBlock className="skeleton-line" style={{ width: '24%', height: 11 }} />
              </div>
              <SkeletonBlock className="skeleton-pill" style={{ width: 78, height: 22 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsCardSkeleton() {
  return (
    <div className="studio-card" style={{ padding: 24, display: 'grid', gap: 22 }} aria-busy="true">
      <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <SkeletonBlock className="skeleton-line" style={{ width: 110, height: 12 }} />
        <SkeletonBlock className="skeleton-line" style={{ width: '100%', height: 40, borderRadius: 10 }} />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <SkeletonBlock className="skeleton-line" style={{ width: 130, height: 12 }} />
        <SkeletonBlock className="skeleton-line" style={{ width: '64%', height: 14 }} />
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <SkeletonBlock className="skeleton-line" style={{ width: 150, height: 12 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <SkeletonBlock className="skeleton-pill" style={{ width: 92, height: 32 }} />
          <SkeletonBlock className="skeleton-pill" style={{ width: 92, height: 32 }} />
          <SkeletonBlock className="skeleton-pill" style={{ width: 108, height: 32 }} />
        </div>
      </div>
    </div>
  );
}

