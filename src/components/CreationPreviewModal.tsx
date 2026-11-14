import { ArrowUpRight, Copy, Check, Download, Film, Image as ImageIcon, X } from 'lucide-react';
import { useState } from 'react';
import { isPlayableVideoUrl, pickStudioAssetForPrompt } from '../data/assets';
import type { AssetSlot, CreationItem } from '../types/studio';
import { ProgressiveImage } from './MinimalLoaders';

interface CreationPreviewModalProps {
  slotPreview: AssetSlot | null;
  creationPreview: CreationItem | null;
  onClose: () => void;
  onUseSlotPrompt?: (slot: AssetSlot) => void;
  onDownloadCreation?: (item: CreationItem) => void;
}

export function CreationPreviewModal({
  slotPreview,
  creationPreview,
  onClose,
  onUseSlotPrompt,
  onDownloadCreation,
}: CreationPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!slotPreview && !creationPreview) return null;

  const title = slotPreview?.title ?? creationPreview?.title ?? 'Creation Preview';
  const prompt = slotPreview?.prompt ?? creationPreview?.request.prompt ?? '';
  const fallbackAsset = pickStudioAssetForPrompt(prompt, creationPreview?.seed ?? 0);
  const mediaUrl = slotPreview?.src ?? creationPreview?.mediaUrl ?? fallbackAsset.src;
  const mediaKind = slotPreview?.mediaKind ?? creationPreview?.mediaKind ?? 'image';
  const ratio = slotPreview?.aspectRatio ?? creationPreview?.request.aspectRatio ?? '1:1';
  const dimensions = slotPreview?.recommendedSize ?? creationPreview?.dimensions ?? '';
  const isPlayableVideo = isPlayableVideoUrl(mediaUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-panel" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`stage-badge ${mediaKind === 'image' ? 'is-image' : 'is-video'}`}>
              {mediaKind === 'image' ? (
                <ImageIcon size={12} strokeWidth={2} />
              ) : (
                <Film size={12} strokeWidth={2} />
              )}
              <span>
                {mediaKind === 'image' ? 'Image' : 'Video'} · {ratio}
              </span>
            </span>
            <h2 id="preview-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              {title}
            </h2>
          </div>

          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close preview">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: 18 }}>
          <div className="preview-stage-well">
            {isPlayableVideo ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                loop
                muted
                style={{ maxHeight: 360, width: '100%', objectFit: 'contain', borderRadius: 10 }}
              />
            ) : (
              <ProgressiveImage
                src={mediaUrl}
                alt={title}
                loading="eager"
                className={mediaKind === 'video' ? 'is-kb-pan' : undefined}
                style={{ maxHeight: 360, width: '100%', objectFit: 'contain', borderRadius: 10 }}
              />
            )}
          </div>

          <div>
            <div className="field-label-row">
              <span className="control-label">Prompt Direction</span>
              <span className="field-hint">{dimensions}</span>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-secondary)' }}>
              {prompt}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn-pill btn-pill-sm btn-outline" onClick={() => void handleCopy()}>
              {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
              <span>{copied ? 'Prompt Copied' : 'Copy Prompt'}</span>
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {creationPreview && onDownloadCreation && (
                <button
                  type="button"
                  className="btn-pill btn-pill-sm btn-primary"
                  onClick={() => onDownloadCreation(creationPreview)}
                >
                  <Download size={13} strokeWidth={1.85} />
                  <span>Download</span>
                </button>
              )}

              {slotPreview && onUseSlotPrompt && (
                <button
                  type="button"
                  className="btn-pill btn-pill-sm btn-primary"
                  onClick={() => {
                    onUseSlotPrompt(slotPreview);
                    onClose();
                  }}
                >
                  <span>Open in Studio</span>
                  <ArrowUpRight size={13} strokeWidth={1.85} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

