import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, PenLine, SlidersHorizontal, Sparkles } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';
import { STUDIO_ASSETS, type StudioMediaAsset } from '../data/assets';
import { HOW_IT_WORKS_STEPS } from '../data/presets';
import type { AspectRatio, GenerationMode } from '../types/studio';
import { ProgressiveImage } from './MinimalLoaders';

interface ModeLaunchPreset {
  prompt?: string;
  aspectRatio?: AspectRatio;
}

interface PossibilitiesSectionProps {
  onSelectModeAndEnter: (mode: GenerationMode, preset?: ModeLaunchPreset) => void;
}

interface WorkflowStory {
  id: string;
  label: string;
  mode: GenerationMode;
  defaultRatio: AspectRatio;
  defaultTone: string;
  prompt: string;
  variations: readonly StudioMediaAsset[];
}

const WORKFLOW_STORIES: readonly WorkflowStory[] = [
  {
    id: 'botanical-story',
    label: 'Botanical',
    mode: 'image',
    defaultRatio: '4:5',
    defaultTone: 'Editorial',
    prompt:
      'Turn a monochrome studio profile into a bright Dada botanical collage with a perched blue macaw and warm peach halo.',
    variations: [STUDIO_ASSETS.img1, STUDIO_ASSETS.img4, STUDIO_ASSETS.img6],
  },
  {
    id: 'alpine-story',
    label: 'Alpine',
    mode: 'image',
    defaultRatio: '1:1',
    defaultTone: 'Painterly',
    prompt:
      'Paint an ancient moss-draped stone hand cradling a quiet emerald tarn where a lone traveler watches white birds rise.',
    variations: [STUDIO_ASSETS.img8, STUDIO_ASSETS.img5, STUDIO_ASSETS.img1],
  },
  {
    id: 'crescent-reel',
    label: 'Crescent',
    mode: 'video',
    defaultRatio: '16:9',
    defaultTone: 'Filmic',
    prompt:
      'Glide slowly past sweeping crimson dunes under an alabaster crescent moon as fine dust catches low horizon light.',
    variations: [STUDIO_ASSETS.img7, STUDIO_ASSETS.img2, STUDIO_ASSETS.img3],
  },
];

const WORKFLOW_TONE_OPTIONS = ['Editorial', 'Painterly', 'Filmic'] as const;
const WORKFLOW_RATIO_OPTIONS: readonly AspectRatio[] = ['4:5', '1:1', '16:9'];

export function PossibilitiesSection({ onSelectModeAndEnter }: PossibilitiesSectionProps) {
  const { howItWorks } = BRAND_CONFIG.sections;

  const [selectedStoryId, setSelectedStoryId] = useState<string>(WORKFLOW_STORIES[0].id);
  const [selectedTone, setSelectedTone] = useState<string>(WORKFLOW_STORIES[0].defaultTone);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(WORKFLOW_STORIES[0].defaultRatio);
  const [selectedVariationIdx, setSelectedVariationIdx] = useState(0);
  const [typedLength, setTypedLength] = useState(WORKFLOW_STORIES[0].prompt.length);

  const activeStory = useMemo(
    () => WORKFLOW_STORIES.find((item) => item.id === selectedStoryId) ?? WORKFLOW_STORIES[0],
    [selectedStoryId]
  );

  const activeAsset = activeStory.variations[selectedVariationIdx] ?? activeStory.variations[0];

  // Smooth prompt typewriter reveal when switching story presets
  useEffect(() => {
    const fullText = activeStory.prompt;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedLength(fullText.length);
      return;
    }

    setTypedLength(12);
    const interval = window.setInterval(() => {
      setTypedLength((prev) => {
        if (prev >= fullText.length) {
          window.clearInterval(interval);
          return fullText.length;
        }
        return Math.min(fullText.length, prev + 3);
      });
    }, 26);

    return () => window.clearInterval(interval);
  }, [activeStory]);

  const handleSelectStory = (story: WorkflowStory) => {
    setSelectedStoryId(story.id);
    setSelectedTone(story.defaultTone);
    setSelectedRatio(story.defaultRatio);
    setSelectedVariationIdx(0);
  };

  const typedPrompt = activeStory.prompt.slice(0, typedLength);
  const isTyping = typedLength < activeStory.prompt.length;

  return (
    <section id="workflow" className="section-block">
      <div className="container">
        <div className="section-header section-header-split">
          <div>
            <div className="section-eyebrow">{howItWorks.eyebrow}</div>
            <h2 className="section-title">{howItWorks.title}</h2>
            <p className="section-subtitle">{howItWorks.subtitle}</p>
          </div>

          <div className="workflow-story-tabs" role="tablist" aria-label="Story examples">
            {WORKFLOW_STORIES.map((story) => {
              const isSelected = story.id === activeStory.id;
              return (
                <button
                  key={story.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`workflow-story-tab ${isSelected ? 'is-active' : ''}`}
                  onClick={() => handleSelectStory(story)}
                >
                  {story.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="workflow-grid">
          {/* Step 01: Describe your vision */}
          <article className="workflow-card workflow-card-story">
            <div className="workflow-card-top">
              <div className="workflow-icon-box" aria-hidden="true">
                <PenLine size={16} strokeWidth={1.75} />
              </div>
              <span className="workflow-step-label">STEP {HOW_IT_WORKS_STEPS[0].step}</span>
            </div>

            <div>
              <h3 className="workflow-card-title">{HOW_IT_WORKS_STEPS[0].title}</h3>
              <p className="workflow-card-copy">{HOW_IT_WORKS_STEPS[0].copy}</p>
            </div>

            <div className="workflow-prompt-sim">
              <p className="workflow-prompt-text">
                &ldquo;{typedPrompt}
                {isTyping && (
                  <span className="workflow-caret" aria-hidden="true">
                    |
                  </span>
                )}
                &rdquo;
              </p>
            </div>
          </article>

          {/* Step 02: Choose your style */}
          <article className="workflow-card workflow-card-story">
            <div className="workflow-card-top">
              <div className="workflow-icon-box" aria-hidden="true">
                <SlidersHorizontal size={16} strokeWidth={1.75} />
              </div>
              <span className="workflow-step-label">STEP {HOW_IT_WORKS_STEPS[1].step}</span>
            </div>

            <div>
              <h3 className="workflow-card-title">{HOW_IT_WORKS_STEPS[1].title}</h3>
              <p className="workflow-card-copy">{HOW_IT_WORKS_STEPS[1].copy}</p>
            </div>

            <div className="workflow-dial-panel">
              <div className="workflow-dial-row">
                <span className="workflow-dial-label">Style</span>
                <div className="workflow-chip-group">
                  {WORKFLOW_TONE_OPTIONS.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      className={`workflow-option-chip ${selectedTone === tone ? 'is-active' : ''}`}
                      onClick={() => setSelectedTone(tone)}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div className="workflow-dial-row">
                <span className="workflow-dial-label">Aspect</span>
                <div className="workflow-chip-group">
                  {WORKFLOW_RATIO_OPTIONS.map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      className={`workflow-option-chip ${selectedRatio === ratio ? 'is-active' : ''}`}
                      onClick={() => setSelectedRatio(ratio)}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* Step 03: Create & refine */}
          <article className="workflow-card workflow-card-story">
            <div className="workflow-card-top">
              <div className="workflow-icon-box" aria-hidden="true">
                <Sparkles size={16} strokeWidth={1.75} />
              </div>
              <span className="workflow-step-label">STEP {HOW_IT_WORKS_STEPS[2].step}</span>
            </div>

            <div>
              <h3 className="workflow-card-title">{HOW_IT_WORKS_STEPS[2].title}</h3>
              <p className="workflow-card-copy">{HOW_IT_WORKS_STEPS[2].copy}</p>
            </div>

            <div className="workflow-result-frame">
              <ProgressiveImage
                key={`${activeStory.id}-${activeAsset.id}`}
                src={activeAsset.src}
                alt={activeAsset.title}
                className={`workflow-result-img ${activeStory.mode === 'video' ? 'is-kb-drift' : 'is-kb-zoom'}`}
                style={{ objectPosition: activeAsset.objectPosition }}
              />
            </div>

            <div className="workflow-story-footer">
              <div className="workflow-swatch-row" role="group" aria-label="Preview frames">
                {activeStory.variations.map((asset, idx) => {
                  const isSelected = idx === selectedVariationIdx;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      className={`workflow-swatch-btn ${isSelected ? 'is-active' : ''}`}
                      aria-label={`Select frame ${idx + 1}: ${asset.title}`}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedVariationIdx(idx)}
                    >
                      <ProgressiveImage
                        src={asset.src}
                        alt=""
                        className="workflow-swatch-img"
                        style={{ objectPosition: asset.objectPosition }}
                      />
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="text-action-link"
                onClick={() =>
                  onSelectModeAndEnter(activeStory.mode, {
                    prompt: `${activeStory.prompt} (${selectedTone})`,
                    aspectRatio: selectedRatio,
                  })
                }
              >
                <span>Open in Studio</span>
                <ArrowRight size={14} strokeWidth={1.85} />
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
