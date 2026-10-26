'use client';

import { useLearningStore } from '@/store/useLearningStore';
import { getLevel } from '@/lib/progress';
import AuthButton from './AuthButton';

const TABS = [
  { id: 'lab', label: 'Lab' },
  { id: 'race', label: 'Race arena' },
  { id: 'debug', label: 'Debug dojo' },
  { id: 'progress', label: 'Progress' },
];

export default function Header({ active, onNavigate }) {
  const xp = useLearningStore((state) => state.xp);
  const level = getLevel(xp);

  return (
    <header className="site-header">
      <div className="header-inner">
        <button type="button" className="brand" onClick={() => onNavigate('lab')}>
          <BrandMark />
          <span className="brand-type">
            <strong>AlgoViz</strong>
            <small>algorithm laboratory</small>
          </span>
        </button>

        <nav className="main-nav" aria-label="Sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab ${active === tab.id ? 'is-active' : ''}`}
              aria-current={active === tab.id ? 'page' : undefined}
              onClick={() => onNavigate(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="level-chip"
            onClick={() => onNavigate('progress')}
            title={`${level.name} · ${xp} XP`}
          >
            <span className="level-dot" aria-hidden="true" />
            <span className="level-name">{level.name}</span>
            <span className="level-xp">{xp} XP</span>
          </button>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="11" fill="none" stroke="currentColor" opacity="0.28" />
      <rect x="10" y="20" width="5" height="10" rx="2" fill="#e9e3d7" />
      <rect x="18" y="13" width="5" height="17" rx="2" fill="#d08a5a" />
      <rect x="26" y="8" width="5" height="22" rx="2" fill="#8fae9b" />
    </svg>
  );
}
