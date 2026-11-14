import { isPlayableVideoUrl, pickStudioAssetForPrompt } from '../data/assets';
import type { AssetSlot } from '../types/studio';
import { ProgressiveImage } from './MinimalLoaders';

interface MediaFrameProps {
  slot: AssetSlot;
  variant?: 'fan' | 'gallery';
  aspectClass?: 'ratio-1-1' | 'ratio-4-3' | 'ratio-4-5' | 'ratio-16-9' | 'ratio-9-16';
}

/**
 * Clean architectural media frame for hero and gallery showcases.
 */
export function MediaFrame({
  slot,
  variant = 'gallery',
  aspectClass = 'ratio-1-1',
}: MediaFrameProps) {
  const fallback = pickStudioAssetForPrompt(slot.prompt || slot.title);
  const resolvedSrc = slot.src ?? fallback.src;
  const resolvedPosition = slot.objectPosition ?? fallback.objectPosition;
  const isPlayableVideo = isPlayableVideoUrl(resolvedSrc);
  const isMotionStudy = slot.mediaKind === 'video' && !isPlayableVideo;

  return (
    <div className={`media-frame ${variant === 'fan' ? 'media-frame-fan' : ''}`}>
      <div className={`media-frame-inner ${aspectClass}`}>
        {isPlayableVideo ? (
          <video
            className="media-frame-asset"
            src={resolvedSrc}
            muted
            loop
            playsInline
            autoPlay
            controls={variant === 'gallery'}
          />
        ) : (
          <ProgressiveImage
            className={`media-frame-asset ${isMotionStudy ? 'is-kb-pan' : ''}`.trim()}
            src={resolvedSrc}
            alt={slot.title}
            loading="lazy"
            style={resolvedPosition ? { objectPosition: resolvedPosition } : undefined}
          />
        )}

        {isMotionStudy && variant === 'gallery' && (
          <span className="frame-motion-indicator" aria-hidden="true">
            <span className="kinetic-eq">
              <span />
              <span />
              <span />
            </span>
            <span>MOTION</span>
          </span>
        )}
      </div>
    </div>
  );
}

