import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  isSignedIn: boolean;
  onOpenAuth: () => void;
  onStartCreating: () => void;
}

export function Navbar({
  isSignedIn,
  onOpenAuth,
  onStartCreating,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="shell-fluid nav-inner">
        <a href="#top" aria-label={BRAND_CONFIG.name}>
          <BrandLogo />
        </a>

        <div className="nav-cluster">
          <nav className="nav-links" aria-label="Primary">
            {BRAND_CONFIG.publicNavLinks.map((item) => (
              <a key={item.href} href={item.href} className="nav-link">
                {item.label}
              </a>
            ))}
          </nav>

          <span className="nav-divider" aria-hidden="true" />

          <div className="nav-actions">
            <button
              type="button"
              className="btn-pill btn-pill-sm btn-outline"
              onClick={onOpenAuth}
            >
              <span>{isSignedIn ? 'Account' : 'Sign In'}</span>
            </button>

            <button
              type="button"
              className="btn-pill btn-pill-sm btn-primary"
              onClick={onStartCreating}
            >
              <span>{BRAND_CONFIG.primaryCtaLabel}</span>
              <ArrowUpRight size={14} strokeWidth={1.85} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
