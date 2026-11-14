import { useState } from 'react';
import {
  Bookmark,
  Check,
  CopyPlus,
  Download,
  Eye,
  Layers,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { isPlayableVideoUrl, pickStudioAssetForPrompt } from '../../data/assets';
import type { CreationItem, CreationsFilter } from '../../types/studio';
import { GalleryGridSkeleton, ProgressiveImage, useSkeletonTransition } from '../MinimalLoaders';

interface MyCreationsViewProps {
  creations: CreationItem[];
  customCollections?: string[];
  activeCollectionFilter?: string | null;
  onStartCreate: () => void;
  onPreviewCreation: (item: CreationItem) => void;
  onDownloadCreation: (item: CreationItem) => void;
  onRenameCreation: (id: string, title: string) => void;
  onDuplicateCreation: (id: string) => void;
  onDeleteCreation: (id: string) => void;
  onToggleSave: (id: string) => void;
  onAssignCollection: (id: string, collection: string) => void;
}

const FILTERS: { key: CreationsFilter; label: string }[] = [
  { key: 'all', label: 'All Assets' },
  { key: 'image', label: 'Images' },
  { key: 'video', label: 'Videos' },
  { key: 'collections', label: 'Collections' },
  { key: 'saved', label: 'Saved Assets' },
];

const COLLECTION_PRESETS = ['Brand Kit', 'Campaigns', 'Motion Studies', 'Editorial'];

export function MyCreationsView({
  creations,
  customCollections = [],
  activeCollectionFilter = null,
  onStartCreate,
  onPreviewCreation,
  onDownloadCreation,
  onRenameCreation,
  onDuplicateCreation,
  onDeleteCreation,
  onToggleSave,
  onAssignCollection,
}: MyCreationsViewProps) {
  const [filter, setFilter] = useState<CreationsFilter>(
    activeCollectionFilter === 'saved'
      ? 'saved'
      : activeCollectionFilter
        ? 'collections'
        : 'all'
  );
  const [selectedCollection, setSelectedCollection] = useState<string>(
    activeCollectionFilter && activeCollectionFilter !== 'saved' ? activeCollectionFilter : 'all'
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const isFilterLoading = useSkeletonTransition(
    `${filter}:${selectedCollection}:${activeCollectionFilter ?? ''}`,
    360
  );

  const handleFilterChange = (next: CreationsFilter) => {
    if (next === filter) return;
    setFilter(next);
  };

  const handleCollectionChange = (next: string) => {
    if (next === selectedCollection) return;
    setSelectedCollection(next);
  };

  const availableCollections = Array.from(
    new Set([
      ...COLLECTION_PRESETS,
      ...customCollections,
      ...creations.map((item) => item.collection).filter((c): c is string => Boolean(c)),
    ])
  );

  const visibleCreations = creations.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'saved') return item.saved;
    if (filter === 'collections') {
      if (!item.collection) return false;
      return selectedCollection === 'all' || item.collection === selectedCollection;
    }
    return item.mediaKind === filter;
  });

  const startRename = (item: CreationItem) => {
    setEditingId(item.id);
    setDraftTitle(item.title);
  };

  const commitRename = (id: string) => {
    if (draftTitle.trim()) {
      onRenameCreation(id, draftTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="studio-subview">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-eyebrow">My Creations</div>
          <h2 className="section-title">Your Creative Space.</h2>
          <p className="section-subtitle">
            All your generated visuals, organized and ready to revisit.
          </p>
        </div>

        <div className="filter-pills" role="tablist" aria-label="Filter my creations">
          {FILTERS.map((tab) => (
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

      {filter === 'collections' && creations.length > 0 && (
        <div className="collection-filter-bar" aria-label="Collection groups">
          <button
            type="button"
            className={`preset-chip ${selectedCollection === 'all' ? 'is-active' : ''}`}
            onClick={() => handleCollectionChange('all')}
          >
            All Collections
          </button>
          {availableCollections.map((col) => {
            const count = creations.filter((item) => item.collection === col).length;
            return (
              <button
                key={col}
                type="button"
                className={`preset-chip ${selectedCollection === col ? 'is-active' : ''}`}
                onClick={() => handleCollectionChange(col)}
              >
                {col} ({count})
              </button>
            );
          })}
        </div>
      )}

      {isFilterLoading ? (
        <GalleryGridSkeleton count={6} />
      ) : creations.length === 0 ? (
        <div className="studio-card empty-state-card">
          <div className="frame-empty-icon" style={{ width: 42, height: 42, margin: '0 auto 14px' }}>
            <Layers size={18} strokeWidth={1.75} />
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Nothing Here Yet.</h3>
          <p className="section-subtitle" style={{ margin: '6px auto 20px', textAlign: 'center' }}>
            Your next great creation starts with an idea.
          </p>
          <button type="button" className="btn-pill btn-primary" onClick={onStartCreate}>
            <Plus size={15} strokeWidth={1.85} />
            <span>Create Your First Asset</span>
          </button>
        </div>
      ) : visibleCreations.length === 0 ? (
        <div className="studio-card empty-state-card">
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>No matching assets</h3>
          <p className="section-subtitle" style={{ margin: '6px auto 16px', textAlign: 'center' }}>
            Switch filters or save a creation to populate this collection.
          </p>
          <button
            type="button"
            className="btn-pill btn-pill-sm btn-secondary"
            onClick={() => setFilter('all')}
          >
            Show All Assets
          </button>
        </div>
      ) : (
        <div className="gallery-grid">
          {visibleCreations.map((item) => {
            const matchedAsset = pickStudioAssetForPrompt(item.request.prompt, item.seed);
            const mediaSrc = item.mediaUrl ?? matchedAsset.src;
            const playableVideo = isPlayableVideoUrl(mediaSrc);
            const isMotionStudy = item.mediaKind === 'video' && !playableVideo;

            return (
            <article key={item.id} className="creation-library-card">
              <div className="media-frame">
                <div className="media-frame-inner ratio-4-3">
                  {playableVideo ? (
                    <video className="media-frame-asset" src={mediaSrc} muted loop playsInline />
                  ) : (
                    <ProgressiveImage
                      className={`media-frame-asset ${isMotionStudy ? 'is-kb-pan' : ''}`.trim()}
                      src={mediaSrc}
                      alt={item.title}
                      style={!item.mediaUrl ? { objectPosition: matchedAsset.objectPosition } : undefined}
                    />
                  )}
                  {isMotionStudy && (
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

              <div style={{ padding: '4px 2px 0' }}>
                {editingId === item.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="text"
                      className="negative-input"
                      style={{ height: 32 }}
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') commitRename(item.id);
                        if (event.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 32, height: 32 }}
                      onClick={() => commitRename(item.id)}
                      aria-label="Save name"
                    >
                      <Check size={14} strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <h3 className="gallery-card-title">{item.title}</h3>
                    <span
                      className={`gallery-tag ${
                        item.mediaKind === 'image' ? 'is-image' : 'is-video'
                      }`}
                    >
                      {item.request.aspectRatio}
                    </span>
                  </div>
                )}

                <p className="gallery-card-prompt">{item.request.prompt}</p>
              </div>

              <div className="creation-actions-bar">
                <button
                  type="button"
                  className="subtle-chip-btn"
                  onClick={() => onPreviewCreation(item)}
                  title="Preview"
                >
                  <Eye size={12} strokeWidth={1.75} />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  className="subtle-chip-btn"
                  onClick={() => onDownloadCreation(item)}
                  title="Download"
                >
                  <Download size={12} strokeWidth={1.75} />
                </button>

                <button
                  type="button"
                  className="subtle-chip-btn"
                  onClick={() => startRename(item)}
                  title="Rename"
                >
                  <Pencil size={12} strokeWidth={1.75} />
                </button>

                <button
                  type="button"
                  className="subtle-chip-btn"
                  onClick={() => onDuplicateCreation(item.id)}
                  title="Duplicate"
                >
                  <CopyPlus size={12} strokeWidth={1.75} />
                </button>

                <button
                  type="button"
                  className={`subtle-chip-btn ${item.saved ? 'is-active' : ''}`}
                  onClick={() => onToggleSave(item.id)}
                  title="Save to collection"
                >
                  <Bookmark size={12} strokeWidth={1.75} />
                </button>

                <select
                  className="collection-select"
                  aria-label={`Assign collection for ${item.title}`}
                  value={item.collection ?? ''}
                  onChange={(event) => onAssignCollection(item.id, event.target.value)}
                >
                  <option value="">No collection</option>
                  {availableCollections.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="subtle-chip-btn"
                  onClick={() => onDeleteCreation(item.id)}
                  title="Delete"
                >
                  <Trash2 size={12} strokeWidth={1.75} />
                </button>
              </div>
            </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

