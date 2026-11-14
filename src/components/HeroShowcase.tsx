import type { CSSProperties } from 'react';
import { ArrowDown, ArrowUpRight, Film, Image as ImageIcon } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';
import type { AssetSlot } from '../types/studio';
import { MediaFrame } from './MediaFrame';

interface HeroShowcaseProps {
  heroSlots: AssetSlot[];
  onStartCreating: () => void;
  onExploreGallery: () => void;
}

const FAN_TRANSFORMS: { rot: string; y: string; z: number }[] = [
  { rot: '-8deg', y: '14px', z: 1 },
  { rot: '-5deg', y: '4px', z: 2 },
  { rot: '-2deg', y: '1px', z: 3 },
  { rot: '0deg', y: '0px', z: 4 },
  { rot: '2deg', y: '1px', z: 3 },
  { rot: '5deg', y: '4px', z: 2 },
  { rot: '8deg', y: '14px', z: 1 },
];

const HERO_CAPABILITIES = [
  { code: '01', label: 'Text-to-Image', accent: 'image' },
  { code: '02', label: 'Text-to-Video', accent: 'video' },
  { code: '03', label: 'Reference Assets', accent: 'image' },
  { code: '04', label: '4K & 24fps Output', accent: 'video' },
] as const;

export function HeroShowcase({
  heroSlots,
  onStartCreating,
  onExploreGallery,
}: HeroShowcaseProps) {
  const scrollToNext = () => {
    document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="top" className="hero-section">
      <div className="hero-main-stage">
        <div className="container">
          <h1 className="hero-headline">
            {BRAND_CONFIG.heroHeadlineLine1}
            <br className="hero-br" /> {BRAND_CONFIG.heroHeadlineLine2}
          </h1>

          <div className="hero-deck-wrap">
            <div className="hero-floating-pill hero-floating-pill-left" aria-hidden="true">
              <ImageIcon size={12} strokeWidth={2} />
              <span>{BRAND_CONFIG.heroLeftBadge}</span>
            </div>

            <div className="hero-floating-pill hero-floating-pill-right" aria-hidden="true">
              <Film size={12} strokeWidth={2} />
              <span>{BRAND_CONFIG.heroRightBadge}</span>
            </div>

            <div className="hero-fan" role="region" aria-label="Featured studio frames">
              {heroSlots.map((slot, index) => {
                const fan = FAN_TRANSFORMS[index] ?? { rot: '0deg', y: '0px', z: 1 };
                const fanStyle = {
                  '--fan-rot': fan.rot,
                  '--fan-y': fan.y,
                  '--fan-z': fan.z,
                } as CSSProperties;

                return (
                  <div key={slot.id} className="hero-fan-item" style={fanStyle}>
                    <MediaFrame
                      slot={slot}
                      variant="fan"
                      aspectClass="ratio-1-1"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <p className="hero-subheadline">{BRAND_CONFIG.heroSubheadline}</p>

          <div className="hero-cta-row">
            <button type="button" className="btn-pill btn-primary" onClick={onStartCreating}>
              <span>{BRAND_CONFIG.primaryCtaLabel}</span>
              <ArrowUpRight size={15} strokeWidth={1.85} />
            </button>

            <button type="button" className="btn-pill btn-secondary" onClick={onExploreGallery}>
              <span>{BRAND_CONFIG.secondaryCtaLabel}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="hero-bottom-bar">
        <div className="shell-fluid hero-bottom-inner">
          <div className="hero-capabilities-list" aria-label="Core capabilities">
            {HERO_CAPABILITIES.map((item) => (
              <span key={item.code} className="hero-capability-item">
                <span
                  className={`mode-dot ${item.accent === 'image' ? 'is-image' : 'is-video'}`}
                  aria-hidden="true"
                />
                <span className="hero-capability-code">{item.code}</span>
                <span>{item.label}</span>
              </span>
            ))}
          </div>

          <button type="button" className="hero-scroll-btn" onClick={scrollToNext}>
            <span>Scroll to explore</span>
            <ArrowDown size={13} strokeWidth={1.85} />
          </button>
        </div>
      </div>
    </section>
  );
}
