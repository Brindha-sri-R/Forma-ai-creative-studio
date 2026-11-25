import { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { PRICING_PLANS } from '../../data/presets';
import type { CreditUsageEntry } from '../../types/studio';
import {
  CreditsPageSkeleton,
  InlineSpinner,
  SettingsCardSkeleton,
  SkeletonBlock,
  useSkeletonTransition,
} from '../MinimalLoaders';

interface CreditsViewProps {
  credits: number;
  maxCredits: number;
  activePlanId: string;
  usageHistory: CreditUsageEntry[];
  onSelectPlan: (planId: string) => void;
}

export function CreditsView({
  credits,
  maxCredits,
  activePlanId,
  usageHistory,
  onSelectPlan,
}: CreditsViewProps) {
  const [activatingPlanId, setActivatingPlanId] = useState<string | null>(null);
  const isInitialLoading = useSkeletonTransition('credits-view', 340);

  const handlePlanClick = (planId: string) => {
    if (activatingPlanId) return;
    setActivatingPlanId(planId);
    setTimeout(() => {
      onSelectPlan(planId);
      setActivatingPlanId(null);
    }, 320);
  };

  return (
    <div className="studio-subview">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-eyebrow">Credits &amp; Plans</div>
          <h2 className="section-title">Plans &amp; Usage</h2>
          <p className="section-subtitle">
            Manage your balance, inspect history, or switch plans.
          </p>
        </div>

        <span className="adapter-status-pill">
          <Zap size={12} strokeWidth={2} />
          <span>
            Balance: {credits} / {maxCredits} credits
          </span>
        </span>
      </div>

      {isInitialLoading ? (
        <CreditsPageSkeleton />
      ) : (
        <>
          <div className="pricing-grid-3" style={{ marginBottom: 28 }}>
            {PRICING_PLANS.map((plan) => {
              const isCurrent = activePlanId === plan.id;
              return (
                <article
                  key={plan.id}
                  className={`pricing-card ${isCurrent ? 'is-featured' : ''}`}
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

                  <button
                    type="button"
                    className={`btn-pill ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={isCurrent || Boolean(activatingPlanId)}
                    onClick={() => handlePlanClick(plan.id)}
                  >
                    {activatingPlanId === plan.id ? (
                      <>
                        <InlineSpinner size={14} />
                        <span>Activating...</span>
                      </>
                    ) : (
                      <span>{isCurrent ? 'Current Plan' : plan.cta}</span>
                    )}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="studio-card" style={{ padding: 24 }}>
            <div className="history-header">
              <span className="history-title">Usage History</span>
              <span className="field-hint">{usageHistory.length} events</span>
            </div>

            {activatingPlanId ? (
              <div className="asset-slot-list" aria-busy="true">
                {Array.from({ length: 2 }, (_, idx) => (
                  <div key={idx} className="asset-slot-row is-skeleton">
                    <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                      <SkeletonBlock className="skeleton-line" style={{ width: '40%', height: 13 }} />
                      <SkeletonBlock className="skeleton-line" style={{ width: '24%', height: 11 }} />
                    </div>
                    <SkeletonBlock className="skeleton-pill" style={{ width: 78, height: 22 }} />
                  </div>
                ))}
              </div>
            ) : usageHistory.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-muted)' }}>
                No credit deductions yet. Image frames use 1 credit per variation; video sequences use 4
                credits.
              </p>
            ) : (
              <div className="asset-slot-list">
                {usageHistory.map((entry) => (
                  <div key={entry.id} className="asset-slot-row">
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{entry.label}</div>
                      <div className="field-hint">{entry.timestamp}</div>
                    </div>
                    <span className="adapter-status-pill">
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta} credits
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface SettingsViewProps {
  userEmail: string;
  credits: number;
  onUpdateEmail: (email: string) => void;
  onSetDemoCredits: (amount: number) => void;
}

export function SettingsView({
  userEmail,
  credits,
  onUpdateEmail,
  onSetDemoCredits,
}: SettingsViewProps) {
  const isInitialLoading = useSkeletonTransition('settings-view', 300);

  return (
    <div className="studio-subview">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-eyebrow">Settings</div>
          <h2 className="section-title">Account &amp; Preferences</h2>
          <p className="section-subtitle">
            Manage your account email, adapter status, and test credit allocation.
          </p>
        </div>
      </div>

      {isInitialLoading ? (
        <SettingsCardSkeleton />
      ) : (
        <div className="studio-card" style={{ padding: 24, display: 'grid', gap: 24 }}>
        <div className="control-group" style={{ maxWidth: 420 }}>
          <label htmlFor="settings-email" className="control-label">
            Account Email
          </label>
          <input
            id="settings-email"
            type="email"
            className="negative-input"
            value={userEmail}
            onChange={(event) => onUpdateEmail(event.target.value)}
          />
        </div>

        <div>
          <div className="control-label" style={{ marginBottom: 8 }}>
            Inference Adapter
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 13.5, color: 'var(--ink-secondary)' }}>
            Status:{' '}
            <strong>
              {import.meta.env.VITE_GENERATION_API_URL
                ? `Connected (${import.meta.env.VITE_GENERATION_API_URL})`
                : 'Frontend adapter ready (set VITE_GENERATION_API_URL to connect live inference)'}
            </strong>
          </p>
        </div>

        <div>
          <div className="control-label" style={{ marginBottom: 8 }}>
            Credit Balance Controls (UX State Testing)
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-muted)' }}>
            Current balance: {credits} credits. Test the out-of-credits experience or replenish
            instantly.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-pill btn-pill-sm btn-outline"
              onClick={() => onSetDemoCredits(0)}
            >
              Simulate Out of Credits (0)
            </button>
            <button
              type="button"
              className="btn-pill btn-pill-sm btn-secondary"
              onClick={() => onSetDemoCredits(25)}
            >
              Restore 25 Credits
            </button>
            <button
              type="button"
              className="btn-pill btn-pill-sm btn-primary"
              onClick={() => onSetDemoCredits(500)}
            >
              Set Pro Balance (500)
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

