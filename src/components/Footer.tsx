import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUp, Check } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';
import type { GenerationMode, StudioSection } from '../types/studio';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onSelectStudioMode: (mode: GenerationMode) => void;
  onEnterStudioSection: (section: StudioSection) => void;
}

export function Footer({
  onSelectStudioMode,
  onEnterStudioSection,
}: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="shell-fluid">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <a href="#top" aria-label={BRAND_CONFIG.name}>
              <BrandLogo />
            </a>
            <p className="footer-brand-copy">{BRAND_CONFIG.heroSubheadline}</p>

            <div className="footer-status-row">
              <span className="footer-status-pill">
                <span className="footer-status-dot" aria-hidden="true" />
                <span>Studio Ready</span>
              </span>
            </div>
          </div>

          <div>
            <h3 className="footer-col-title">Creative Studio</h3>
            <ul className="footer-link-list">
              <li>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => onSelectStudioMode('image')}
                >
                  Image Generation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => onSelectStudioMode('video')}
                >
                  Video Generation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => onEnterStudioSection('creations')}
                >
                  My Creations
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link"
                  onClick={() => onEnterStudioSection('dashboard')}
                >
                  Studio Dashboard
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="footer-col-title">Navigation</h3>
            <ul className="footer-link-list">
              <li>
                <a href="#top" className="footer-link">
                  Home
                </a>
              </li>
              <li>
                <a href="#explore" className="footer-link">
                  Explore
                </a>
              </li>
              <li>
                <a href="#pricing" className="footer-link">
                  Pricing (INR)
                </a>
              </li>
              <li>
                <a href="#about" className="footer-link">
                  About &amp; FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="footer-col-title">Release Notes</h3>
            <p className="footer-newsletter-copy">
              Receive updates on new still and motion model releases.
            </p>

            {subscribed ? (
              <div className="footer-subscribed-note">
                <Check size={14} strokeWidth={2} />
                <span>Added to studio updates.</span>
              </div>
            ) : (
              <form className="footer-form" onSubmit={handleSubscribe}>
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@studio.com"
                  className="footer-input"
                />
                <button
                  type="submit"
                  className="footer-submit-btn"
                  aria-label="Subscribe to release notes"
                >
                  <ArrowRight size={14} strokeWidth={1.85} />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; {new Date().getFullYear()} {BRAND_CONFIG.name}. {BRAND_CONFIG.tagline}.
          </p>

          <div className="footer-bottom-right">
            <span className="footer-meta-tag">INR (₹)</span>
            <button type="button" className="footer-top-btn" onClick={scrollToTop}>
              <span>Back to top</span>
              <ArrowUp size={13} strokeWidth={1.85} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
