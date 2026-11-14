import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Mail,
  ShieldAlert,
  User,
  X,
} from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';
import { STUDIO_ASSETS } from '../data/assets';
import { BrandLogo } from './BrandLogo';
import { InlineSpinner, ProgressiveImage } from './MinimalLoaders';
import { api } from '../services/apiClient';

type AuthView = 'signin' | 'signup' | 'forgot-email' | 'forgot-verify' | 'forgot-success';

interface AuthModalProps {
  isOpen: boolean;
  isSignedIn: boolean;
  userEmail: string;
  destinationHint?: string | null;
  onClose: () => void;
  onSignIn: (email: string) => void;
  onSignOut: () => void;
  onGoToDashboard?: () => void;
}

const DEMO_RESET_CODE = '482910';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43Zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45Z" />
    </svg>
  );
}

export function AuthModal({
  isOpen,
  isSignedIn,
  userEmail,
  destinationHint,
  onClose,
  onSignIn,
  onSignOut,
  onGoToDashboard,
}: AuthModalProps) {
  const [view, setView] = useState<AuthView>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [codeResent, setCodeResent] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [discardTarget, setDiscardTarget] = useState<'close' | 'signin' | null>(null);
  const [socialBusy, setSocialBusy] = useState<'google' | 'apple' | null>(null);
  const [formBusy, setFormBusy] = useState<'auth' | 'reset-send' | 'reset-update' | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDiscardTarget(null);
      setErrors({});
      setSocialBusy(null);
      setFormBusy(null);
      setCodeResent(false);
      return;
    }
    if (!isSignedIn) {
      setView('signin');
    }
  }, [isOpen, isSignedIn]);

  if (!isOpen) return null;

  const hasPendingResetEdits =
    view === 'forgot-verify' &&
    Boolean(resetCode.trim() || newPassword.trim() || confirmPassword.trim());

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const resetToView = (nextView: AuthView) => {
    setErrors({});
    setDiscardTarget(null);
    setView(nextView);
  };

  const attemptClose = () => {
    if (hasPendingResetEdits) {
      setDiscardTarget('close');
      return;
    }
    setDiscardTarget(null);
    onClose();
  };

  const attemptBackToSignIn = () => {
    if (hasPendingResetEdits) {
      setDiscardTarget('signin');
      return;
    }
    resetToView('signin');
  };

  const handleConfirmDiscard = () => {
    const target = discardTarget;
    setDiscardTarget(null);
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    if (target === 'close') {
      setView('signin');
      onClose();
      return;
    }
    setView('signin');
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (socialBusy || formBusy) return;

    const nextErrors: Record<string, string> = {};
    const trimmedEmail = email.trim();

    if (view === 'signup' && fullName.trim().length < 2) {
      nextErrors.fullName = 'Please enter your name or studio name.';
    }
    if (!trimmedEmail) {
      nextErrors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address (e.g. you@studio.in).';
    }
    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (view === 'signup' && password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    } else if (view === 'signin' && password.length < 4) {
      nextErrors.password = 'Enter at least 4 characters for your password.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setFormBusy('auth');
    try {
      if (view === 'signup') {
        const res = await api.auth.signup({
          email: trimmedEmail,
          password,
          fullName: fullName.trim(),
        });
        setFormBusy(null);
        onSignIn(res.user.email);
      } else {
        const res = await api.auth.signin({
          email: trimmedEmail,
          password,
        });
        setFormBusy(null);
        onSignIn(res.user.email);
      }
    } catch (err: any) {
      setFormBusy(null);
      const msg = err.message || 'Authentication failed';
      setErrors({
        general: msg,
        ...(msg.toLowerCase().includes('password') ? { password: msg } : {}),
        ...(msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account') ? { email: msg } : {}),
      });
    }
  };

  const handleSendResetCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formBusy) return;
    const trimmedResetEmail = resetEmail.trim();
    if (!trimmedResetEmail) {
      setErrors({ resetEmail: 'Enter the email associated with your account.' });
      return;
    }
    if (!EMAIL_REGEX.test(trimmedResetEmail)) {
      setErrors({ resetEmail: 'Enter a valid email address.' });
      return;
    }

    setErrors({});
    setFormBusy('reset-send');
    try {
      await api.auth.forgotPassword(trimmedResetEmail);
      setFormBusy(null);
      setCodeResent(false);
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setView('forgot-verify');
    } catch (err: any) {
      setFormBusy(null);
      setErrors({ resetEmail: err.message || 'Failed to send reset code' });
    }
  };

  const handleVerifyAndUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formBusy) return;
    const nextErrors: Record<string, string> = {};
    const trimmedCode = resetCode.trim();

    if (!trimmedCode) {
      nextErrors.resetCode = 'Enter the 6-digit verification code.';
    } else if (trimmedCode !== DEMO_RESET_CODE) {
      nextErrors.resetCode = `Verification code does not match. Use ${DEMO_RESET_CODE}.`;
    }

    if (!newPassword) {
      nextErrors.newPassword = 'Create a new password.';
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = 'New password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setFormBusy('reset-update');
    try {
      await api.auth.resetPassword({
        email: resetEmail.trim(),
        code: trimmedCode,
        newPassword,
      });
      setFormBusy(null);
      setDiscardTarget(null);
      setEmail(resetEmail.trim());
      setPassword('');
      setView('forgot-success');
    } catch (err: any) {
      setFormBusy(null);
      setErrors({ general: err.message || 'Failed to update password' });
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    if (socialBusy || formBusy) return;
    setErrors({});
    setSocialBusy(provider);
    try {
      const res = await api.auth.oauth(provider);
      setSocialBusy(null);
      onSignIn(res.user.email);
    } catch (err: any) {
      setSocialBusy(null);
      setErrors({ general: err.message || 'OAuth authentication failed' });
    }
  };

  const openForgotPassword = () => {
    setErrors({});
    setDiscardTarget(null);
    setResetEmail(email.trim());
    setView('forgot-email');
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) attemptClose();
      }}
    >
      <div className="modal-panel auth-modal-panel">
        <div className="auth-showcase-pane">
          <div className="auth-showcase-card">
            <div className="auth-showcase-head">
              <BrandLogo showWordmark={false} />
              <span className="auth-showcase-tag">{BRAND_CONFIG.tagline}</span>
            </div>

            <div className="auth-showcase-art">
              <div className="auth-art-frame">
                <ProgressiveImage
                  src={STUDIO_ASSETS.img1.src}
                  alt={STUDIO_ASSETS.img1.title}
                  loading="eager"
                  style={{ objectPosition: STUDIO_ASSETS.img1.objectPosition }}
                />
              </div>

              <div className="auth-art-pills">
                <span className="stage-badge is-image">
                  <ImageIcon size={11} strokeWidth={2} />
                  <span>Image Studio</span>
                </span>
                <span className="stage-badge is-video">
                  <Film size={11} strokeWidth={2} />
                  <span>Video Motion</span>
                </span>
              </div>
            </div>

            <p className="auth-showcase-caption">
              Turn simple prompts into high-resolution stills and cinematic motion in one unified
              workspace.
            </p>
          </div>
        </div>

        <div className="auth-form-pane">
          <div className="auth-topbar">
            <div className="auth-topbar-left">
              {isSignedIn ? (
                <span className="section-eyebrow" style={{ margin: 0 }}>
                  Studio Account
                </span>
              ) : view !== 'signin' && view !== 'signup' ? (
                <button type="button" className="auth-back-link" onClick={attemptBackToSignIn}>
                  <ArrowLeft size={14} strokeWidth={1.85} />
                  <span>Back to Sign in</span>
                </button>
              ) : null}
            </div>

            <button
              type="button"
              className="icon-btn auth-close-btn"
              onClick={attemptClose}
              aria-label="Close dialog"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>

          <div className="auth-form-body">
            {discardTarget && (
              <div className="auth-discard-guard" role="alert">
                <div className="auth-discard-title">
                  <ShieldAlert size={15} strokeWidth={1.85} />
                  <span>Discard password reset changes?</span>
                </div>
                <p className="auth-discard-copy">
                  You have unsaved reset code or password entries. Going back now will clear them.
                </p>
                <div className="auth-discard-actions">
                  <button
                    type="button"
                    className="btn-pill btn-outline"
                    style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                    onClick={() => setDiscardTarget(null)}
                  >
                    Continue Reset
                  </button>
                  <button
                    type="button"
                    className="btn-pill btn-primary"
                    style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                    onClick={handleConfirmDiscard}
                  >
                    Discard &amp; Go Back
                  </button>
                </div>
              </div>
            )}

            {isSignedIn ? (
              <div className="auth-signed-in-box">
                <div>
                  <span className="stage-badge is-video" style={{ marginBottom: 12 }}>
                    Active Session
                  </span>
                  <h2 id="auth-modal-title" className="auth-heading">
                    Welcome back
                  </h2>
                  <p className="auth-subcopy">
                    Signed in as <strong>{userEmail}</strong>. Your credits and creations are ready
                    in the studio dashboard.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn-pill btn-cobalt"
                    style={{ width: '100%', height: 44 }}
                    onClick={() => {
                      onClose();
                      onGoToDashboard?.();
                    }}
                  >
                    <span>Open Creative Dashboard</span>
                    <ArrowRight size={15} strokeWidth={1.85} />
                  </button>

                  <button
                    type="button"
                    className="btn-pill btn-outline"
                    style={{ width: '100%', height: 42 }}
                    onClick={onSignOut}
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : view === 'signin' || view === 'signup' ? (
              <>
                <div>
                  <h2 id="auth-modal-title" className="auth-heading">
                    {view === 'signin' ? 'Sign in' : 'Create account'}
                  </h2>
                  {destinationHint && <p className="auth-destination-hint">{destinationHint}</p>}
                </div>

                <form onSubmit={handleAuthSubmit} className="auth-email-form" noValidate>
                  {errors.general && (
                    <div className="auth-field-error" style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 8 }}>
                      <AlertCircle size={14} strokeWidth={2} />
                      <span>{errors.general}</span>
                    </div>
                  )}
                  {view === 'signup' && (
                    <div className="auth-field-group">
                      <label htmlFor="auth-name" className="auth-field-label">
                        Full name
                      </label>
                      <div className={`auth-soft-field ${errors.fullName ? 'is-error' : ''}`}>
                        <User size={16} strokeWidth={1.75} className="auth-field-icon" />
                        <input
                          id="auth-name"
                          type="text"
                          value={fullName}
                          onChange={(event) => {
                            setFullName(event.target.value);
                            clearFieldError('fullName');
                          }}
                          placeholder="Your name or studio"
                          autoComplete="name"
                        />
                      </div>
                      {errors.fullName && (
                        <span className="auth-field-error">
                          <AlertCircle size={12} strokeWidth={2} />
                          <span>{errors.fullName}</span>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="auth-field-group">
                    <label htmlFor="auth-email" className="auth-field-label">
                      Email address
                    </label>
                    <div className={`auth-soft-field ${errors.email ? 'is-error' : ''}`}>
                      <Mail size={16} strokeWidth={1.75} className="auth-field-icon" />
                      <input
                        id="auth-email"
                        type="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          clearFieldError('email');
                        }}
                        placeholder="you@studio.in"
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <span className="auth-field-error">
                        <AlertCircle size={12} strokeWidth={2} />
                        <span>{errors.email}</span>
                      </span>
                    )}
                  </div>

                  <div className="auth-field-group">
                    <div className="auth-label-row">
                      <label htmlFor="auth-password" className="auth-field-label">
                        Password
                      </label>
                      {view === 'signin' && (
                        <button
                          type="button"
                          className="auth-forgot-btn"
                          onClick={openForgotPassword}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>

                    <div className={`auth-soft-field ${errors.password ? 'is-error' : ''}`}>
                      <Lock size={16} strokeWidth={1.75} className="auth-field-icon" />
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          clearFieldError('password');
                        }}
                        placeholder={
                          view === 'signup' ? 'Create password (6+ chars)' : 'Enter your password'
                        }
                        autoComplete={view === 'signin' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff size={15} strokeWidth={1.75} />
                        ) : (
                          <Eye size={15} strokeWidth={1.75} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <span className="auth-field-error">
                        <AlertCircle size={12} strokeWidth={2} />
                        <span>{errors.password}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-pill btn-cobalt"
                    style={{ width: '100%', height: 44, marginTop: 4 }}
                    disabled={Boolean(socialBusy || formBusy)}
                  >
                    {formBusy === 'auth' ? (
                      <>
                        <InlineSpinner size={15} />
                        <span>{view === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{view === 'signin' ? 'Sign in' : 'Create Studio Account'}</span>
                        <ArrowRight size={15} strokeWidth={1.85} />
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-divider" role="separator">
                  <span>Or continue with</span>
                </div>

                <div className="auth-oauth-row">
                  <button
                    type="button"
                    className="auth-oauth-btn auth-oauth-google"
                    disabled={Boolean(socialBusy || formBusy)}
                    onClick={() => handleOAuth('google')}
                  >
                    {socialBusy === 'google' ? <InlineSpinner size={15} /> : <GoogleMark />}
                    <span>
                      {socialBusy === 'google' ? 'Connecting...' : 'Continue with Google'}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="auth-oauth-btn"
                    disabled={Boolean(socialBusy || formBusy)}
                    onClick={() => handleOAuth('apple')}
                  >
                    {socialBusy === 'apple' ? <InlineSpinner size={14} /> : <AppleMark />}
                    <span>{socialBusy === 'apple' ? 'Connecting...' : 'Apple ID'}</span>
                  </button>
                </div>

                <div className="auth-bottom-switch">
                  <span>
                    {view === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                  </span>
                  <button
                    type="button"
                    className="auth-switch-btn"
                    onClick={() => resetToView(view === 'signin' ? 'signup' : 'signin')}
                  >
                    {view === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </div>
              </>
            ) : view === 'forgot-email' ? (
              <>
                <div>
                  <span className="stage-badge is-image" style={{ marginBottom: 10 }}>
                    Account Recovery
                  </span>
                  <h2 id="auth-modal-title" className="auth-heading">
                    Forgot password?
                  </h2>
                  <p className="auth-destination-hint">
                    Enter the email for your studio account and we will send a 6-digit verification
                    code.
                  </p>
                </div>

                <form onSubmit={handleSendResetCode} className="auth-email-form" noValidate>
                  <div className="auth-field-group">
                    <label htmlFor="reset-email" className="auth-field-label">
                      Email address
                    </label>
                    <div className={`auth-soft-field ${errors.resetEmail ? 'is-error' : ''}`}>
                      <Mail size={16} strokeWidth={1.75} className="auth-field-icon" />
                      <input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(event) => {
                          setResetEmail(event.target.value);
                          clearFieldError('resetEmail');
                        }}
                        placeholder="you@studio.in"
                        autoComplete="email"
                      />
                    </div>
                    {errors.resetEmail && (
                      <span className="auth-field-error">
                        <AlertCircle size={12} strokeWidth={2} />
                        <span>{errors.resetEmail}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-pill btn-cobalt"
                    style={{ width: '100%', height: 44, marginTop: 4 }}
                    disabled={Boolean(formBusy)}
                  >
                    {formBusy === 'reset-send' ? (
                      <>
                        <InlineSpinner size={15} />
                        <span>Sending code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Code</span>
                        <ArrowRight size={15} strokeWidth={1.85} />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : view === 'forgot-verify' ? (
              <>
                <div>
                  <div className="auth-step-header">
                    <button
                      type="button"
                      className="auth-inline-back"
                      onClick={() => resetToView('forgot-email')}
                    >
                      <ArrowLeft size={13} strokeWidth={1.9} />
                      <span>Change email</span>
                    </button>
                  </div>
                  <h2 id="auth-modal-title" className="auth-heading">
                    Set new password
                  </h2>
                  <p className="auth-destination-hint">
                    Enter the 6-digit code sent to <strong>{resetEmail}</strong>.
                  </p>
                </div>

                <div className="auth-code-hint">
                  <span>
                    {codeResent ? 'New code sent:' : 'Demo verification code:'}{' '}
                    <strong>{DEMO_RESET_CODE}</strong>
                  </span>
                  <button
                    type="button"
                    className="auth-fill-code-btn"
                    onClick={() => {
                      setResetCode(DEMO_RESET_CODE);
                      clearFieldError('resetCode');
                    }}
                  >
                    Fill code
                  </button>
                </div>

                <form
                  onSubmit={handleVerifyAndUpdatePassword}
                  className="auth-email-form"
                  noValidate
                >
                  <div className="auth-field-group">
                    <div className="auth-label-row">
                      <label htmlFor="reset-code" className="auth-field-label">
                        Verification code
                      </label>
                      <button
                        type="button"
                        className="auth-forgot-btn"
                        onClick={() => setCodeResent(true)}
                      >
                        Resend code
                      </button>
                    </div>
                    <div className={`auth-soft-field ${errors.resetCode ? 'is-error' : ''}`}>
                      <KeyRound size={16} strokeWidth={1.75} className="auth-field-icon" />
                      <input
                        id="reset-code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={resetCode}
                        onChange={(event) => {
                          setResetCode(event.target.value.replace(/\D/g, ''));
                          clearFieldError('resetCode');
                        }}
                        placeholder="6-digit code"
                      />
                    </div>
                    {errors.resetCode && (
                      <span className="auth-field-error">
                        <AlertCircle size={12} strokeWidth={2} />
                        <span>{errors.resetCode}</span>
                      </span>
                    )}
                  </div>

                  <div className="auth-field-group">
                    <label htmlFor="reset-new-password" className="auth-field-label">
                      New password
                    </label>
                    <div className={`auth-soft-field ${errors.newPassword ? 'is-error' : ''}`}>
                      <Lock size={16} strokeWidth={1.75} className="auth-field-icon" />
                      <input
                        id="reset-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(event.target.value);
                          clearFieldError('newPassword');
                        }}
                        placeholder="Minimum 6 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? (
                          <EyeOff size={15} strokeWidth={1.75} />
                        ) : (
                          <Eye size={15} strokeWidth={1.75} />
                        )}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <span className="auth-field-error">
                        <AlertCircle size={12} strokeWidth={2} />
                        <span>{errors.newPassword}</span>
                      </span>
                    )}
                  </div>

                  <div className="auth-field-group">
                    <label htmlFor="reset-confirm-password" className="auth-field-label">
                      Confirm password
                    </label>
                    <div className={`auth-soft-field ${errors.confirmPassword ? 'is-error' : ''}`}>
                      <Lock size={16} strokeWidth={1.75} className="auth-field-icon" />
                      <input
                        id="reset-confirm-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          clearFieldError('confirmPassword');
                        }}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <span className="auth-field-error">
                        <AlertCircle size={12} strokeWidth={2} />
                        <span>{errors.confirmPassword}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-pill btn-cobalt"
                    style={{ width: '100%', height: 44, marginTop: 4 }}
                    disabled={Boolean(formBusy)}
                  >
                    {formBusy === 'reset-update' ? (
                      <>
                        <InlineSpinner size={15} />
                        <span>Updating password...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password</span>
                        <ArrowRight size={15} strokeWidth={1.85} />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="auth-signed-in-box">
                <div>
                  <span className="stage-badge is-video" style={{ marginBottom: 12 }}>
                    <CheckCircle2 size={12} strokeWidth={2} />
                    <span>Password Updated</span>
                  </span>
                  <h2 id="auth-modal-title" className="auth-heading">
                    All set
                  </h2>
                  <p className="auth-subcopy">
                    Your password for <strong>{resetEmail}</strong> has been updated. Sign in with
                    your new password to open the studio.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-pill btn-cobalt"
                  style={{ width: '100%', height: 44, marginTop: 6 }}
                  onClick={() => resetToView('signin')}
                >
                  <span>Return to Sign in</span>
                  <ArrowRight size={15} strokeWidth={1.85} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
