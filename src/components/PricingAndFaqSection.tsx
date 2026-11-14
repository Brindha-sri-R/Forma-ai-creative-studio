import { useState } from 'react';
import { ArrowUpRight, Check, ChevronDown } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';
import { FAQ_ITEMS, PRICING_PLANS } from '../data/presets';

interface PricingAndFaqSectionProps {
  onStartCreating: () => void;
  onSelectPlan: (planId: string) => void;
}

export function PricingAndFaqSection({
  onStartCreating,
  onSelectPlan,
}: PricingAndFaqSectionProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const { pricing, faq, finalCta } = BRAND_CONFIG.sections;

  return (
    <>
      <section id="pricing" className="section-block">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">{pricing.eyebrow}</div>
              <h2 className="section-title">{pricing.title}</h2>
              <p className="section-subtitle">{pricing.subtitle}</p>
            </div>
          </div>

          <div className="pricing-grid-3">
            {PRICING_PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`pricing-card ${plan.featured ? 'is-featured' : ''}`}
              >
                <div>
                  <div className="pricing-card-head">
                    <div className="section-eyebrow" style={{ marginBottom: 6 }}>
                      {plan.tier}
                    </div>
                    <span className="adapter-status-pill">{plan.credits}</span>
                  </div>

                  <div className="pricing-price">
                    {plan.priceInr} <span className="pricing-period">{plan.period}</span>
                  </div>
                  <p className="section-subtitle">{plan.description}</p>
                </div>

                <ul className="pricing-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={15} strokeWidth={2} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div>
                  <button
                    type="button"
                    className={`btn-pill ${plan.featured ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%' }}
                    onClick={() => onSelectPlan(plan.id)}
                  >
                    <span>{plan.cta}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="section-block">
        <div className="container">
          <div className="faq-layout">
            <div>
              <div className="section-eyebrow">{faq.eyebrow}</div>
              <h2 className="section-title">{faq.title}</h2>
              <p className="section-subtitle">
                Everything about credits, unified image and video workflows, visual references, and
                commercial asset ownership.
              </p>
            </div>

            <div className="faq-list">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={item.question} className="faq-item">
                    <button
                      type="button"
                      className="faq-trigger"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        size={16}
                        strokeWidth={1.75}
                        className={`faq-chevron ${isOpen ? 'is-open' : ''}`}
                      />
                    </button>
                    {isOpen && <p className="faq-answer">{item.answer}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="section-block final-cta-section">
        <div className="container final-cta-box">
          <h2 className="final-cta-title">{finalCta.title}</h2>
          <p className="final-cta-subtitle">{finalCta.subtitle}</p>
          <button type="button" className="btn-pill btn-primary" onClick={onStartCreating}>
            <span>{finalCta.cta}</span>
            <ArrowUpRight size={15} strokeWidth={1.85} />
          </button>
        </div>
      </section>
    </>
  );
}

