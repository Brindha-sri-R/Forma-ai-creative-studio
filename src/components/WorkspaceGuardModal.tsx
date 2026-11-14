import { ArrowLeft, CheckCircle2, LogOut, ShieldAlert, X } from 'lucide-react';

export type WorkspaceGuardMode = 'confirm-signout' | 'confirm-exit-studio' | null;

interface WorkspaceGuardModalProps {
  mode: WorkspaceGuardMode;
  userEmail: string;
  hasActiveDraft: boolean;
  onCancel: () => void;
  onGoToWebsiteStaySignedIn: () => void;
  onConfirmSignOut: () => void;
  onSwitchToSignOut?: () => void;
}

export function WorkspaceGuardModal({
  mode,
  userEmail,
  hasActiveDraft,
  onCancel,
  onGoToWebsiteStaySignedIn,
  onConfirmSignOut,
  onSwitchToSignOut,
}: WorkspaceGuardModalProps) {
  if (!mode) return null;

  const isSignOut = mode === 'confirm-signout';

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-guard-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="modal-panel guard-modal-panel">
        <div className="guard-modal-head">
          <span className={`stage-badge ${isSignOut || hasActiveDraft ? 'is-image' : 'is-video'}`}>
            {isSignOut || hasActiveDraft ? (
              <ShieldAlert size={12} strokeWidth={2} />
            ) : (
              <CheckCircle2 size={12} strokeWidth={2} />
            )}
            <span>
              {isSignOut
                ? 'Confirm Sign Out'
                : hasActiveDraft
                  ? 'Active Draft in Create'
                  : 'Returning to Website'}
            </span>
          </span>

          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close dialog">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="guard-modal-body">
          <h2 id="workspace-guard-title" className="guard-modal-title">
            {isSignOut ? 'Sign out of Forma Studio?' : 'Return to public website?'}
          </h2>

          <p className="guard-modal-copy">
            {isSignOut ? (
              <>
                You are currently signed in as <strong>{userEmail}</strong>. If you only want to
                browse the site again, you can return without logging out.
              </>
            ) : hasActiveDraft ? (
              <>
                You have an active prompt or reference in Create. Returning to the website keeps you
                signed in as <strong>{userEmail}</strong>, while unsent Create composer inputs will
                reset.
              </>
            ) : (
              <>
                Your session remains signed in as <strong>{userEmail}</strong> so you can return to
                your workspace anytime without signing in again.
              </>
            )}
          </p>
        </div>

        {isSignOut ? (
          <div className="guard-modal-actions is-stacked">
            <button
              type="button"
              className="btn-pill btn-cobalt"
              style={{ width: '100%', height: 42 }}
              onClick={onGoToWebsiteStaySignedIn}
            >
              <ArrowLeft size={15} strokeWidth={1.85} />
              <span>Return to Website (Stay Signed In)</span>
            </button>

            <div className="guard-actions-row">
              <button
                type="button"
                className="btn-pill btn-outline"
                style={{ flex: 1, height: 40 }}
                onClick={onCancel}
              >
                <span>Cancel</span>
              </button>

              <button
                type="button"
                className="btn-pill btn-danger-outline"
                style={{ flex: 1, height: 40 }}
                onClick={onConfirmSignOut}
              >
                <LogOut size={14} strokeWidth={1.85} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="guard-modal-actions is-stacked">
            <div className="guard-actions-row">
              <button
                type="button"
                className="btn-pill btn-outline"
                style={{ flex: 1, height: 42 }}
                onClick={onCancel}
              >
                <span>Stay in Studio</span>
              </button>

              <button
                type="button"
                className="btn-pill btn-cobalt"
                style={{ flex: 1.25, height: 42 }}
                onClick={onGoToWebsiteStaySignedIn}
              >
                <ArrowLeft size={15} strokeWidth={1.85} />
                <span>Back to Website</span>
              </button>
            </div>

            {onSwitchToSignOut && (
              <div className="guard-footer-note">
                <span>Want to sign out instead?</span>
                <button type="button" className="auth-switch-btn" onClick={onSwitchToSignOut}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

