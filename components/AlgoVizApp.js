'use client';

import { useEffect, useState } from 'react';
import { parseShareHash, replaceHash } from '@/lib/share';
import Header from './Header';
import LabScreen from './LabScreen';
import RaceScreen from './RaceScreen';
import DebugScreen from './DebugScreen';
import ProgressScreen from './ProgressScreen';

export default function AlgoVizApp() {
  const [tab, setTab] = useState('lab');
  const [ready, setReady] = useState(false);
  const [initial, setInitial] = useState({ lab: null, race: null, nonce: 0 });

  useEffect(() => {
    const applyHash = (hash) => {
      const parsed = parseShareHash(hash);
      setTab(parsed.tab);
      setInitial((previous) => ({
        lab: parsed.tab === 'lab' ? parsed.lab : previous.lab,
        race: parsed.tab === 'race' ? parsed.race : previous.race,
        nonce: previous.nonce + 1,
      }));
      setReady(true);
    };

    applyHash(window.location.hash);

    const onHashChange = () => applyHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function navigate(nextTab) {
    if (nextTab === tab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setTab(nextTab);
    replaceHash(`#${nextTab}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openLesson(algorithm) {
    setInitial((previous) => ({
      lab: { algorithm, step: 0, language: 'js', array: null },
      race: previous.race,
      nonce: previous.nonce + 1,
    }));
    setTab('lab');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <Header active={tab} onNavigate={navigate} />

      <main className="app-main" id="main-content">
        <div className="screen-slot" hidden={tab !== 'lab'}>
          <LabScreen
            active={tab === 'lab'}
            initial={initial.lab}
            ready={ready}
            seed={initial.nonce}
          />
        </div>
        <div className="screen-slot" hidden={tab !== 'race'}>
          <RaceScreen
            active={tab === 'race'}
            initial={initial.race}
            ready={ready}
            seed={initial.nonce}
          />
        </div>
        {tab === 'debug' && <DebugScreen />}
        {tab === 'progress' && <ProgressScreen onOpenLesson={openLesson} onNavigate={navigate} />}
      </main>

      <footer className="site-footer">
        <div>
          <strong>AlgoViz</strong>
          <span>Sorting, made visible.</span>
        </div>
        <p>
          Built for curious students. Traces are generated locally; progress lives in this browser.
        </p>
        <nav className="footer-nav" aria-label="Footer">
          <a className="footer-link" href="/">
            Landing page ↑
          </a>
          <button type="button" className="footer-link" onClick={() => navigate('lab')}>
            Back to the lab ↑
          </button>
        </nav>
      </footer>
    </div>
  );
}
