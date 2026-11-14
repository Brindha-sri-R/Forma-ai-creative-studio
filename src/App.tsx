import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { CreationPreviewModal } from './components/CreationPreviewModal';
import {
  WorkspaceGuardModal,
  type WorkspaceGuardMode,
} from './components/WorkspaceGuardModal';
import { CuratedGallery } from './components/CuratedGallery';
import { Footer } from './components/Footer';
import { HeroShowcase } from './components/HeroShowcase';
import { Navbar } from './components/Navbar';
import { PossibilitiesSection } from './components/PossibilitiesSection';
import { PricingAndFaqSection } from './components/PricingAndFaqSection';
import { CreateWorkspace } from './components/studio/CreateWorkspace';
import { CreditsView, SettingsView } from './components/studio/CreditsAndSettingsView';
import { MyCreationsView } from './components/studio/MyCreationsView';
import { StudioDashboard, type WorkspaceTemplateSeed } from './components/studio/StudioDashboard';
import { StudioShell } from './components/studio/StudioShell';
import { INITIAL_ASSET_SLOTS } from './data/assets';
import { api, getStoredToken } from './services/apiClient';
import type {
  AppView,
  AspectRatio,
  AssetSlot,
  CreationItem,
  CreditUsageEntry,
  GenerationMode,
  StudioSection,
} from './types/studio';

type PendingDestination =
  | { kind: 'studio'; section: StudioSection }
  | { kind: 'mode'; mode: GenerationMode; prompt?: string; aspectRatio?: AspectRatio }
  | { kind: 'slot-prompt'; slot: AssetSlot }
  | { kind: 'plan'; planId: string };

const VALID_RATIOS = new Set<AspectRatio>(['1:1', '4:5', '16:9', '9:16']);

const PLAN_CREDIT_MAP: Record<string, { credits: number; label: string }> = {
  free: { credits: 25, label: 'Switched to Free Plan' },
  pro: { credits: 500, label: 'Upgraded to Pro Plan (₹1,499/mo)' },
  studio: { credits: 2000, label: 'Upgraded to Studio Plan (₹3,999/mo)' },
};

export function App() {
  const [appView, setAppView] = useState<AppView>('public');
  const [studioSection, setStudioSection] = useState<StudioSection>('dashboard');

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('creator@studio.in');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<PendingDestination | null>(null);

  const [activePlanId, setActivePlanId] = useState('free');
  const [credits, setCredits] = useState(25);
  const [maxCredits, setMaxCredits] = useState(25);
  const [usageHistory, setUsageHistory] = useState<CreditUsageEntry[]>([]);

  const [creations, setCreations] = useState<CreationItem[]>([]);
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [folders, setFolders] = useState<string[]>(['Brand Kit', 'Campaigns']);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [slotPreview, setSlotPreview] = useState<AssetSlot | null>(null);
  const [creationPreview, setCreationPreview] = useState<CreationItem | null>(null);

  const [draftPromptTrigger, setDraftPromptTrigger] = useState<{
    mode: GenerationMode;
    prompt?: string;
    aspectRatio?: AspectRatio;
    nonce: number;
  } | null>(null);

  const [hasActiveDraft, setHasActiveDraft] = useState(false);
  const [guardPrompt, setGuardPrompt] = useState<WorkspaceGuardMode>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const guardPromptRef = useRef<WorkspaceGuardMode>(null);

  useEffect(() => {
    guardPromptRef.current = guardPrompt;
  }, [guardPrompt]);

  // Check stored auth session on initial load
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      api.auth
        .getMe()
        .then((user) => {
          setIsSignedIn(true);
          setUserEmail(user.email);
          setActivePlanId(user.planId || 'free');
          setCredits(user.credits);
          setMaxCredits(user.maxCredits);
        })
        .catch(() => {
          api.auth.signout();
          setIsSignedIn(false);
        });
    }
  }, []);

  // Fetch creations, folders, and credit ledger when user is signed in
  useEffect(() => {
    if (!isSignedIn) return;

    api.creations
      .list()
      .then((items) => setCreations(items))
      .catch((err) => console.warn('Failed to load creations:', err));

    api.collections
      .list()
      .then((cols) => {
        if (cols && cols.length > 0) {
          setFolders((prev) => Array.from(new Set([...prev, ...cols])));
        }
      })
      .catch((err) => console.warn('Failed to load collections:', err));

    api.credits
      .getHistory()
      .then((history) => {
        if (history) setUsageHistory(history);
      })
      .catch((err) => console.warn('Failed to load credit history:', err));
  }, [isSignedIn]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsAuthOpen(false);
      setPendingDestination(null);
      setGuardPrompt(null);
      setSlotPreview(null);
      setCreationPreview(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (appView !== 'studio') return;
    window.history.pushState({ formaStudio: true }, '');

    const onPopState = () => {
      if (!guardPromptRef.current) {
        window.history.pushState({ formaStudio: true }, '');
        setGuardPrompt('confirm-exit-studio');
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [appView]);

  const heroSlots = useMemo(
    () => INITIAL_ASSET_SLOTS.filter((slot) => slot.section === 'hero'),
    []
  );

  const gallerySlots = useMemo(
    () => INITIAL_ASSET_SLOTS.filter((slot) => slot.section === 'gallery'),
    []
  );

  const enterStudio = useCallback((section: StudioSection = 'create') => {
    setAppView('studio');
    setStudioSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (section === 'create') {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, []);

  const enterStudioWithMode = useCallback(
    (mode: GenerationMode, prompt?: string, aspectRatio?: AspectRatio) => {
      setDraftPromptTrigger({
        mode,
        prompt,
        aspectRatio: aspectRatio ?? (mode === 'video' ? '16:9' : '4:5'),
        nonce: Date.now(),
      });
      enterStudio('create');
    },
    [enterStudio]
  );

  const exploreGallery = useCallback(() => {
    document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const loadSlotPromptIntoStudio = useCallback(
    (slot: AssetSlot) => {
      const aspectRatio = VALID_RATIOS.has(slot.aspectRatio as AspectRatio)
        ? (slot.aspectRatio as AspectRatio)
        : slot.mediaKind === 'video'
          ? '16:9'
          : '4:5';

      setDraftPromptTrigger({
        mode: slot.mediaKind,
        prompt: slot.prompt,
        aspectRatio,
        nonce: Date.now(),
      });
      enterStudio('create');
    },
    [enterStudio]
  );

  const handleConsumeCredits = useCallback(
    (amount: number, label: string, mode: GenerationMode) => {
      setCredits((prev) => Math.max(0, prev - amount));
      setUsageHistory((prev) => [
        {
          id: `use-${Date.now()}`,
          label,
          mode,
          delta: -amount,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
    },
    []
  );

  const applyPlanSelection = useCallback(
    async (planId: string) => {
      const plan = PLAN_CREDIT_MAP[planId];
      if (!plan) return;
      setActivePlanId(planId);
      setCredits(plan.credits);
      setMaxCredits(plan.credits);

      if (isSignedIn) {
        try {
          const res = await api.credits.selectPlan(planId);
          setCredits(res.credits);
          setMaxCredits(res.maxCredits);
          setUsageHistory((prev) => [res.transaction, ...prev]);
        } catch (err) {
          console.warn('Failed to persist plan selection:', err);
        }
      } else {
        setUsageHistory((prev) => [
          {
            id: `plan-${Date.now()}`,
            label: plan.label,
            mode: 'topup',
            delta: plan.credits,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev,
        ]);
      }
      enterStudio('credits');
    },
    [enterStudio, isSignedIn]
  );

  const executeDestination = useCallback(
    (dest: PendingDestination) => {
      switch (dest.kind) {
        case 'studio':
          enterStudio(dest.section);
          break;
        case 'mode':
          enterStudioWithMode(dest.mode, dest.prompt, dest.aspectRatio);
          break;
        case 'slot-prompt':
          loadSlotPromptIntoStudio(dest.slot);
          break;
        case 'plan':
          applyPlanSelection(dest.planId);
          break;
      }
    },
    [applyPlanSelection, enterStudio, enterStudioWithMode, loadSlotPromptIntoStudio]
  );

  const navigateWithAuth = useCallback(
    (dest: PendingDestination) => {
      setSlotPreview(null);
      if (isSignedIn) {
        executeDestination(dest);
        return;
      }
      setPendingDestination(dest);
      setIsAuthOpen(true);
    },
    [executeDestination, isSignedIn]
  );

  const handleUseSlotPrompt = useCallback(
    (slot: AssetSlot) => {
      navigateWithAuth({ kind: 'slot-prompt', slot });
    },
    [navigateWithAuth]
  );

  const handleSelectPlan = useCallback(
    (planId: string) => {
      navigateWithAuth({ kind: 'plan', planId });
    },
    [navigateWithAuth]
  );

  const handleSignInSuccess = useCallback(
    (email: string) => {
      setUserEmail(email);
      setIsSignedIn(true);
      setIsAuthOpen(false);

      // Refresh data from backend
      api.auth.getMe().then((u) => {
        if (u) {
          setUserEmail(u.email);
          setActivePlanId(u.planId || 'free');
          setCredits(u.credits);
          setMaxCredits(u.maxCredits);
        }
      }).catch(console.warn);

      const next = pendingDestination ?? { kind: 'studio', section: 'dashboard' };
      setPendingDestination(null);
      executeDestination(next);
    },
    [executeDestination, pendingDestination]
  );

  const handleConfirmSignOut = useCallback(() => {
    api.auth.signout();
    setGuardPrompt(null);
    setHasActiveDraft(false);
    setIsSignedIn(false);
    setPendingDestination(null);
    setActiveFolder(null);
    setWorkspaceSearch('');
    setAppView('public');
  }, []);

  const handleRequestSignOut = useCallback(() => {
    setGuardPrompt('confirm-signout');
  }, []);

  const handleRequestExitStudio = useCallback(() => {
    setGuardPrompt('confirm-exit-studio');
  }, []);

  const handleConfirmExitWebsiteStaySignedIn = useCallback(() => {
    setGuardPrompt(null);
    setHasActiveDraft(false);
    setAppView('public');
  }, []);

  const handleCreateFolder = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setFolders((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setActiveFolder(trimmed);
    setStudioSection('creations');

    if (isSignedIn) {
      api.collections.create(trimmed).catch((err) => console.warn('Failed to save folder:', err));
    }
  }, [isSignedIn]);

  const handleLaunchStarter = useCallback(
    (starter: WorkspaceTemplateSeed) => {
      setDraftPromptTrigger({
        mode: starter.mode,
        prompt: starter.prompt ?? '',
        aspectRatio: starter.aspectRatio,
        nonce: Date.now(),
      });
      enterStudio('create');
    },
    [enterStudio]
  );

  const authDestinationHint = useMemo(() => {
    if (!pendingDestination || pendingDestination.kind === 'studio') {
      return 'Sign in to enter your Image & Video Creative Dashboard.';
    }
    if (pendingDestination.kind === 'mode') {
      return pendingDestination.mode === 'image'
        ? 'Sign in to launch the Image Generation workspace.'
        : 'Sign in to launch the Video Generation workspace.';
    }
    if (pendingDestination.kind === 'slot-prompt') {
      return `Sign in to open "${pendingDestination.slot.title}" in the studio.`;
    }
    return 'Sign in to activate your plan and open Studio.';
  }, [pendingDestination]);

  const handleAddCreation = useCallback((item: CreationItem) => {
    setCreations((prev) => [item, ...prev]);
  }, []);

  const handleRenameCreation = useCallback((id: string, title: string) => {
    setCreations((prev) => prev.map((item) => (item.id === id ? { ...item, title } : item)));
    if (isSignedIn) {
      api.creations.update(id, { title }).catch((err) => console.warn('Failed to update title:', err));
    }
  }, [isSignedIn]);

  const handleDuplicateCreation = useCallback((id: string) => {
    if (isSignedIn) {
      api.creations
        .duplicate(id)
        .then((copy) => {
          setCreations((prev) => [copy, ...prev]);
        })
        .catch((err) => {
          console.warn('Backend duplicate failed, falling back to local copy:', err);
          setCreations((prev) => {
            const target = prev.find((item) => item.id === id);
            if (!target) return prev;
            const copy: CreationItem = {
              ...target,
              id: `crt-${Date.now()}`,
              title: `${target.title} (Copy)`,
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            return [copy, ...prev];
          });
        });
      return;
    }

    setCreations((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target) return prev;
      const copy: CreationItem = {
        ...target,
        id: `crt-${Date.now()}`,
        title: `${target.title} (Copy)`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return [copy, ...prev];
    });
  }, [isSignedIn]);

  const handleDeleteCreation = useCallback((id: string) => {
    setCreations((prev) => prev.filter((item) => item.id !== id));
    if (isSignedIn) {
      api.creations.delete(id).catch((err) => console.warn('Failed to delete creation:', err));
    }
  }, [isSignedIn]);

  const handleToggleSave = useCallback((id: string) => {
    setCreations((prev) => {
      const target = prev.find((item) => item.id === id);
      const nextSaved = target ? !target.saved : true;
      if (isSignedIn) {
        api.creations.update(id, { saved: nextSaved }).catch((err) => console.warn('Failed to toggle save:', err));
      }
      return prev.map((item) => (item.id === id ? { ...item, saved: nextSaved } : item));
    });
  }, [isSignedIn]);

  const handleAssignCollection = useCallback((id: string, collection: string) => {
    setCreations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              collection: collection || undefined,
              saved: collection ? true : item.saved,
            }
          : item
      )
    );
    if (isSignedIn) {
      api.creations.update(id, { collection: collection || null }).catch((err) => console.warn('Failed to assign collection:', err));
    }
  }, [isSignedIn]);

  const handleClearHistory = useCallback(() => {
    setCreations([]);
  }, []);

  const handleDownloadCreation = useCallback((item: CreationItem) => {
    const mediaUrl = item.mediaUrl;
    if (mediaUrl) {
      const ext = mediaUrl.endsWith('.png') ? '.png' : mediaUrl.endsWith('.mp4') ? '.mp4' : mediaUrl.endsWith('.svg') ? '.svg' : '.jpg';
      const cleanTitle = (item.title || item.request?.prompt || 'forma-creation')
        .slice(0, 35)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase();
      const downloadFilename = `${cleanTitle}-${item.id}${ext}`;

      // Reliable blob fetch download to guarantee filename preservation and prevent navigation
      fetch(mediaUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = downloadFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        })
        .catch(() => {
          const link = document.createElement('a');
          link.href = mediaUrl;
          link.download = downloadFilename;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      return;
    }

    const specBlob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' });
    const specUrl = URL.createObjectURL(specBlob);
    const link = document.createElement('a');
    link.href = specUrl;
    link.download = `${item.id}-spec.json`;
    link.click();
    URL.revokeObjectURL(specUrl);
  }, []);

  return (
    <>
      {appView === 'public' ? (
        <>
          <Navbar
            isSignedIn={isSignedIn}
            onOpenAuth={() => {
              if (!isSignedIn) {
                setPendingDestination({ kind: 'studio', section: 'dashboard' });
              }
              setIsAuthOpen(true);
            }}
            onStartCreating={() => navigateWithAuth({ kind: 'studio', section: 'dashboard' })}
          />

          <main>
            <HeroShowcase
              heroSlots={heroSlots}
              onStartCreating={() => navigateWithAuth({ kind: 'studio', section: 'dashboard' })}
              onExploreGallery={exploreGallery}
            />

            <PossibilitiesSection
              onSelectModeAndEnter={(mode, preset) =>
                navigateWithAuth({
                  kind: 'mode',
                  mode,
                  prompt: preset?.prompt,
                  aspectRatio: preset?.aspectRatio,
                })
              }
            />

            <CuratedGallery
              gallerySlots={gallerySlots}
              variant="public"
              onUsePrompt={handleUseSlotPrompt}
              onViewCreation={(slot) => setSlotPreview(slot)}
              onExploreAll={() => navigateWithAuth({ kind: 'studio', section: 'explore' })}
            />

            <PricingAndFaqSection
              onStartCreating={() => navigateWithAuth({ kind: 'studio', section: 'dashboard' })}
              onSelectPlan={handleSelectPlan}
            />
          </main>

          <Footer
            onSelectStudioMode={(mode) => navigateWithAuth({ kind: 'mode', mode })}
            onEnterStudioSection={(section) => navigateWithAuth({ kind: 'studio', section })}
          />
        </>
      ) : (
        <StudioShell
          activeSection={studioSection}
          credits={credits}
          maxCredits={maxCredits}
          creationsCount={creations.length}
          userEmail={userEmail}
          searchQuery={workspaceSearch}
          folders={folders}
          activeFolder={activeFolder}
          onSearchChange={setWorkspaceSearch}
          onSelectFolder={setActiveFolder}
          onCreateFolder={handleCreateFolder}
          onNavigateSection={(section) => {
            if (section !== 'creations') setActiveFolder(null);
            setStudioSection(section);
          }}
          onExitStudio={handleRequestExitStudio}
          onSignOut={handleRequestSignOut}
        >
          {studioSection === 'dashboard' && (
            <StudioDashboard
              credits={credits}
              creations={creations}
              searchQuery={workspaceSearch}
              onStartMode={enterStudioWithMode}
              onLaunchStarter={handleLaunchStarter}
              onPreviewCreation={(item) => setCreationPreview(item)}
            />
          )}

          {studioSection === 'create' && (
            <CreateWorkspace
              credits={credits}
              creations={creations}
              draftPromptTrigger={draftPromptTrigger}
              textareaRef={textareaRef}
              onConsumeCredits={handleConsumeCredits}
              onAddCreation={handleAddCreation}
              onToggleSave={handleToggleSave}
              onDownloadCreation={handleDownloadCreation}
              onPreviewCreation={(item) => setCreationPreview(item)}
              onNavigateCredits={() => setStudioSection('credits')}
              onClearHistory={handleClearHistory}
              onDraftChange={setHasActiveDraft}
            />
          )}

          {studioSection === 'creations' && (
            <MyCreationsView
              key={activeFolder ?? 'archive'}
              creations={creations}
              customCollections={folders}
              activeCollectionFilter={activeFolder}
              onStartCreate={() => enterStudio('create')}
              onPreviewCreation={(item) => setCreationPreview(item)}
              onDownloadCreation={handleDownloadCreation}
              onRenameCreation={handleRenameCreation}
              onDuplicateCreation={handleDuplicateCreation}
              onDeleteCreation={handleDeleteCreation}
              onToggleSave={handleToggleSave}
              onAssignCollection={handleAssignCollection}
            />
          )}

          {studioSection === 'explore' && (
            <CuratedGallery
              gallerySlots={gallerySlots}
              variant="studio"
              onUsePrompt={handleUseSlotPrompt}
              onViewCreation={(slot) => setSlotPreview(slot)}
            />
          )}

          {studioSection === 'credits' && (
            <CreditsView
              credits={credits}
              maxCredits={maxCredits}
              activePlanId={activePlanId}
              usageHistory={usageHistory}
              onSelectPlan={handleSelectPlan}
            />
          )}

          {studioSection === 'settings' && (
            <SettingsView
              userEmail={userEmail}
              credits={credits}
              onUpdateEmail={(newEmail) => {
                setUserEmail(newEmail);
                if (isSignedIn) {
                  api.auth.updateProfile({ email: newEmail }).catch(console.warn);
                }
              }}
              onSetDemoCredits={(amount) => {
                setCredits(amount);
                setMaxCredits((prev) => Math.max(prev, amount));
                if (isSignedIn) {
                  api.credits
                    .topup(amount, `Manual balance override: ${amount} credits`)
                    .then((res) => {
                      if (res && res.transaction) {
                        setUsageHistory((prev) => [res.transaction, ...prev]);
                      }
                    })
                    .catch(console.warn);
                }
              }}
            />
          )}
        </StudioShell>
      )}

      <AuthModal
        isOpen={isAuthOpen}
        isSignedIn={isSignedIn}
        userEmail={userEmail}
        destinationHint={authDestinationHint}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingDestination(null);
        }}
        onSignIn={handleSignInSuccess}
        onSignOut={() => {
          setIsAuthOpen(false);
          handleRequestSignOut();
        }}
        onGoToDashboard={() => enterStudio('dashboard')}
      />

      <WorkspaceGuardModal
        mode={guardPrompt}
        userEmail={userEmail}
        hasActiveDraft={hasActiveDraft}
        onCancel={() => setGuardPrompt(null)}
        onGoToWebsiteStaySignedIn={handleConfirmExitWebsiteStaySignedIn}
        onConfirmSignOut={handleConfirmSignOut}
        onSwitchToSignOut={() => setGuardPrompt('confirm-signout')}
      />

      <CreationPreviewModal
        slotPreview={slotPreview}
        creationPreview={creationPreview}
        onClose={() => {
          setSlotPreview(null);
          setCreationPreview(null);
        }}
        onUseSlotPrompt={handleUseSlotPrompt}
        onDownloadCreation={handleDownloadCreation}
      />
    </>
  );
}

export default App;
