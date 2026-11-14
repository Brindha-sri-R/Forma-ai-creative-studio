import { BRAND_CONFIG } from '../config/brand';

interface BrandLogoProps {
  showTagline?: boolean;
  showWordmark?: boolean;
}

export function BrandLogo({ showTagline = false, showWordmark = true }: BrandLogoProps) {
  return (
    <span className="brand-link">
      <span className="brand-mark" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1" fill="currentColor" />
          <rect x="8" y="1.5" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.55" />
          <rect x="1.5" y="8" width="4.5" height="4.5" rx="1" fill="currentColor" opacity="0.55" />
          <rect x="8" y="8" width="4.5" height="4.5" rx="1" fill="currentColor" />
        </svg>
      </span>
      {showWordmark && <span>{BRAND_CONFIG.name}</span>}
      {showWordmark && showTagline && (
        <span className="footer-copy" style={{ fontWeight: 400 }}>
          · {BRAND_CONFIG.tagline}
        </span>
      )}
    </span>
  );
}

