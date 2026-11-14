import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  Archive,
  ArrowLeft,
  Check,
  ChevronDown,
  Compass,
  CreditCard,
  Folder,
  FolderPlus,
  LayoutGrid,
  LogOut,
  PlusSquare,
  Search,
  Settings,
  X,
  Zap,
} from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand';
import type { StudioSection } from '../../types/studio';
import { BrandLogo } from '../BrandLogo';

interface StudioShellProps {
  activeSection: StudioSection;
  credits: number;
  maxCredits: number;
  creationsCount: number;
  userEmail: string;
  searchQuery: string;
  folders: string[];
  activeFolder: string | null;
  onSearchChange: (value: string) => void;
  onSelectFolder: (folder: string | null) => void;
  onCreateFolder: (name: string) => void;
  onNavigateSection: (section: StudioSection) => void;
  onExitStudio: () => void;
  onSignOut: () => void;
  children: ReactNode;
}

const MOBILE_NAV_ITEMS: { id: StudioSection; label: string }[] = [
  { id: 'dashboard', label: 'All' },
  { id: 'create', label: 'Create' },
  { id: 'creations', label: 'Archive' },
  { id: 'explore', label: 'Explore' },
  { id: 'credits', label: 'Credits' },
  { id: 'settings', label: 'Settings' },
];

export function StudioShell({
  activeSection,
  credits,
  maxCredits,
  creationsCount,
  userEmail,
  searchQuery,
  folders,
  activeFolder,
  onSearchChange,
  onSelectFolder,
  onCreateFolder,
  onNavigateSection,
  onExitStudio,
  onSignOut,
  children,
}: StudioShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuWrapRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const handleAddFolder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    onCreateFolder(trimmed);
    setNewFolderName('');
    setAddingFolder(false);
  };

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard API may be unavailable.
    }
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 1600);
  };

  const workspaceInitial = (userEmail.trim()[0] ?? 'F').toUpperCase();

  return (
    <div className="studio-app-shell">
      <aside className="studio-sidebar" aria-label="Workspace navigation">
        <div className="sidebar-top-stack">
          <div className="workspace-switcher-wrap" ref={menuWrapRef}>
            <button
              type="button"
              className="workspace-switcher-btn"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="workspace-avatar" aria-hidden="true">
                {workspaceInitial}
              </span>
              <span className="workspace-name">My Workspace</span>
              <ChevronDown size={14} strokeWidth={1.75} className="workspace-chevron" />
            </button>

            {menuOpen && (
              <div className="workspace-menu" role="menu">
                <div className="workspace-menu-email">{userEmail}</div>
                <button
                  type="button"
                  className="workspace-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigateSection('settings');
                  }}
                >
                  <Settings size={14} strokeWidth={1.75} />
                  <span>Workspace Settings</span>
                </button>
                <button
                  type="button"
                  className="workspace-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onExitStudio();
                  }}
                >
                  <ArrowLeft size={14} strokeWidth={1.75} />
                  <span>Public Website</span>
                </button>
                <div className="workspace-menu-sep" />
                <button
                  type="button"
                  className="workspace-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                >
                  <LogOut size={14} strokeWidth={1.75} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          <div className="sidebar-search-box">
            <Search size={14} strokeWidth={1.75} className="sidebar-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                onSearchChange(event.target.value);
                if (activeSection !== 'dashboard') {
                  onNavigateSection('dashboard');
                }
              }}
              placeholder="Search..."
              aria-label="Search workspace"
            />
            {searchQuery && (
              <button
                type="button"
                className="sidebar-search-clear"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                <X size={12} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="sidebar-group">
            <div className="sidebar-group-label">Projects</div>
            <nav className="studio-sidebar-nav" aria-label="Workspace sections">
              <button
                type="button"
                className={`studio-nav-item ${
                  activeSection === 'dashboard' && !activeFolder ? 'is-active' : ''
                }`}
                onClick={() => {
                  onSelectFolder(null);
                  onNavigateSection('dashboard');
                }}
              >
                <LayoutGrid size={15} strokeWidth={1.75} />
                <span>All</span>
              </button>

              <button
                type="button"
                className={`studio-nav-item ${
                  activeSection === 'creations' && !activeFolder ? 'is-active' : ''
                }`}
                onClick={() => {
                  onSelectFolder(null);
                  onNavigateSection('creations');
                }}
              >
                <Archive size={15} strokeWidth={1.75} />
                <span>Archive</span>
                {creationsCount > 0 && <span className="studio-nav-count">{creationsCount}</span>}
              </button>

              {folders.map((folder) => {
                const isSelected = activeSection === 'creations' && activeFolder === folder;
                return (
                  <button
                    key={folder}
                    type="button"
                    className={`studio-nav-item ${isSelected ? 'is-active' : ''}`}
                    onClick={() => {
                      onSelectFolder(folder);
                      onNavigateSection('creations');
                    }}
                  >
                    <Folder size={15} strokeWidth={1.75} />
                    <span>{folder}</span>
                  </button>
                );
              })}

              {addingFolder ? (
                <form onSubmit={handleAddFolder} className="sidebar-new-folder-form">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(event) => setNewFolderName(event.target.value)}
                    placeholder="Folder name..."
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        setAddingFolder(false);
                        setNewFolderName('');
                      }
                    }}
                  />
                  <button type="submit" className="subtle-chip-btn" style={{ height: 26 }}>
                    <Check size={12} strokeWidth={2} />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  className="studio-nav-item studio-nav-muted"
                  onClick={() => setAddingFolder(true)}
                >
                  <FolderPlus size={15} strokeWidth={1.75} />
                  <span>+ New folder...</span>
                </button>
              )}
            </nav>
          </div>

          <div className="sidebar-group">
            <div className="sidebar-group-label">Studio</div>
            <nav className="studio-sidebar-nav" aria-label="Creative tools">
              <button
                type="button"
                className={`studio-nav-item ${activeSection === 'create' ? 'is-active' : ''}`}
                onClick={() => onNavigateSection('create')}
              >
                <PlusSquare size={15} strokeWidth={1.75} />
                <span>Generator</span>
              </button>

              <button
                type="button"
                className={`studio-nav-item ${activeSection === 'explore' ? 'is-active' : ''}`}
                onClick={() => onNavigateSection('explore')}
              >
                <Compass size={15} strokeWidth={1.75} />
                <span>Explore</span>
              </button>

              <button
                type="button"
                className={`studio-nav-item ${activeSection === 'credits' ? 'is-active' : ''}`}
                onClick={() => onNavigateSection('credits')}
              >
                <CreditCard size={15} strokeWidth={1.75} />
                <span>Credits &amp; Plans</span>
                <span className="studio-nav-count">{credits}</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="studio-sidebar-foot">
          <button
            type="button"
            className="credit-summary-card"
            onClick={() => onNavigateSection('credits')}
          >
            <div className="credit-summary-top">
              <span className="credit-summary-label">
                <Zap size={12} strokeWidth={2} />
                <span>Studio Credits</span>
              </span>
              <span className="field-hint">
                {credits} / {maxCredits}
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill is-image"
                style={{ width: `${Math.min(100, Math.round((credits / maxCredits) * 100))}%` }}
              />
            </div>
          </button>

          <div className="sidebar-invite-row">
            <span className="sidebar-invite-label">Invite your team</span>
            <button
              type="button"
              className="sidebar-copy-btn"
              onClick={() => void handleCopyInvite()}
            >
              {copiedInvite ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>
      </aside>

      <div className="studio-main-column">
        <header className="studio-mobile-topbar">
          <button
            type="button"
            onClick={onExitStudio}
            aria-label={`Return to ${BRAND_CONFIG.name} website`}
          >
            <BrandLogo />
          </button>

          <div className="studio-mobile-tabs" aria-label="Studio sections">
            {MOBILE_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`filter-pill ${activeSection === item.id ? 'is-active' : ''}`}
                onClick={() => onNavigateSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="workspace-secondary-btn"
            style={{ height: 30, padding: '0 10px', flexShrink: 0 }}
            onClick={onExitStudio}
          >
            <ArrowLeft size={13} strokeWidth={1.85} />
            <span>Site</span>
          </button>
        </header>

        <main className="studio-app-content">{children}</main>
      </div>
    </div>
  );
}

