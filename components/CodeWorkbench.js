'use client';

import dynamic from 'next/dynamic';
import { loader } from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';
import { ALGORITHMS } from '@/lib/algorithms';
import { LANGUAGES, getAnchorLine, getSnippet } from '@/lib/snippets';
import { runUserCode } from '@/lib/sandbox';
import { useLearningStore } from '@/store/useLearningStore';

// Pin the CDN version so a silent upstream release cannot change editor
// behaviour under learners. The package version is the source of truth.
loader.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' },
});

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="editor-loading" role="status">
      <span className="loading-bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      Loading the editor…
    </div>
  ),
});

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 12.5,
  lineHeight: 21,
  fontFamily: "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
  fontLigatures: true,
  padding: { top: 14, bottom: 14 },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  renderLineHighlight: 'none',
  smoothScrolling: true,
  tabSize: 2,
  wordWrap: 'off',
  scrollbar: { vertical: 'auto', horizontal: 'auto', verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  folding: true,
  glyphMargin: false,
  lineNumbersMinChars: 3,
  accessibilitySupport: 'auto',
};

export default function CodeWorkbench({
  algorithmId,
  language,
  onLanguageChange,
  trace,
  stepIndex,
  customTrace,
  onCustomTrace,
  onResetCustom,
  array,
  playing,
}) {
  const meta = ALGORITHMS[algorithmId];
  const [code, setCode] = useState(() => getSnippet(algorithmId, 'js').code);
  const [runState, setRunState] = useState({ status: 'idle', message: '' });
  const [running, setRunning] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationIds = useRef([]);
  const recordSandboxRun = useLearningStore((state) => state.recordSandboxRun);
  const recordLanguageView = useLearningStore((state) => state.recordLanguageView);

  const languageMeta = LANGUAGES.find((item) => item.id === language) ?? LANGUAGES[0];
  const snippet = getSnippet(algorithmId, language);
  const readOnly = !languageMeta.editable;
  const activeStep = trace.steps[stepIndex] ?? trace.steps[0];
  const activeLine = customTrace || !activeStep ? 0 : getAnchorLine(algorithmId, language, activeStep.tag);
  const value = language === 'js' ? code : snippet.code;

  useEffect(() => {
    setCode(getSnippet(algorithmId, 'js').code);
    setRunState({ status: 'idle', message: '' });
  }, [algorithmId]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !editorReady) return;

    const model = editor.getModel();
    if (!model) return;

    if (!activeLine) {
      decorationIds.current = editor.deltaDecorations(decorationIds.current, []);
      return;
    }

    const line = Math.min(Math.max(1, activeLine), model.getLineCount());
    decorationIds.current = editor.deltaDecorations(decorationIds.current, [
      {
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'editor-active-line',
          linesDecorationsClassName: 'editor-active-gutter',
        },
      },
    ]);

    if (!playing) editor.revealLineInCenterIfOutsideViewport(line, monaco.editor.ScrollType.Smooth);
  }, [activeLine, editorReady, language, playing, value]);

  useEffect(() => {
    return () => {
      const editor = editorRef.current;
      if (editor) editor.deltaDecorations(decorationIds.current, []);
    };
  }, []);

  function beforeMount(monaco) {
    monaco.editor.defineTheme('algoviz-mocha', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8a7a6c', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'd08a5a' },
        { token: 'number', foreground: '8fae9b' },
        { token: 'string', foreground: 'e6b36a' },
        { token: 'function', foreground: 'e9e3d7' },
        { token: 'type', foreground: 'a893c9' },
        { token: 'delimiter', foreground: 'b9b0a3' },
      ],
      colors: {
        'editor.background': '#1b1512',
        'editor.foreground': '#e9e3d7',
        'editorLineNumber.foreground': '#665a50',
        'editorLineNumber.activeForeground': '#d08a5a',
        'editor.selectionBackground': '#453329',
        'editor.inactiveSelectionBackground': '#2e241e',
        'editorCursor.foreground': '#e6b36a',
        'editorIndentGuide.background1': '#2e241e',
        'editorIndentGuide.activeBackground1': '#574438',
        'editorWidget.background': '#221a16',
        'editorWidget.border': '#3a2d25',
        'scrollbarSlider.background': '#4b3a3055',
        'scrollbarSlider.hoverBackground': '#6b534466',
      },
    });
  }

  async function handleRun() {
    if (running || readOnly) return;
    setRunning(true);
    setRunState({ status: 'running', message: 'Tracing your code locally…' });

    const result = await runUserCode({ code, values: array });
    setRunning(false);

    if (result.error) {
      setRunState({ status: 'error', message: result.error });
      return;
    }

    recordSandboxRun();
    onCustomTrace({
      ...result,
      algorithm: algorithmId,
      initial: [...array],
    });
    setRunState({
      status: result.sorted ? 'ok' : 'warning',
      message: result.sorted
        ? `Sorted in ${result.duration} ms · ${result.steps.length} frames captured.`
        : 'Trace captured, but the final array is not ascending. The invariant failed.',
    });
  }

  function resetCode() {
    setCode(getSnippet(algorithmId, 'js').code);
    setRunState({ status: 'idle', message: '' });
    onResetCustom();
  }

  function chooseLanguage(nextLanguage) {
    onLanguageChange(nextLanguage);
    recordLanguageView(nextLanguage);
  }

  return (
    <section className="panel workbench" aria-labelledby="workbench-title">
      <header className="workbench-head">
        <div>
          <p className="eyebrow">Code workbench</p>
          <h2 id="workbench-title">{meta.name}, four ways</h2>
        </div>
        <span className={`edit-chip ${readOnly ? 'is-readonly' : 'is-editable'}`}>
          {readOnly ? 'read-only reference' : 'editable sandbox'}
        </span>
      </header>

      <div className="language-tabs" role="group" aria-label="Reference language">
        {LANGUAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`language-pill ${language === item.id ? 'is-active' : ''}`}
            aria-pressed={language === item.id}
            onClick={() => chooseLanguage(item.id)}
            title={`Show the ${item.label} implementation`}
          >
            {item.short}
          </button>
        ))}
        <span className="language-fullname">{languageMeta.label}</span>
      </div>

      <div className="editor-shell">
        <MonacoEditor
          height="370px"
          language={languageMeta.monaco}
          theme="algoviz-mocha"
          value={value}
          beforeMount={beforeMount}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
            setEditorReady(true);
          }}
          onChange={(nextValue) => {
            if (readOnly) return;
            setCode(nextValue ?? '');
            if (runState.status !== 'running') {
              setRunState({ status: 'edited', message: 'Edited. Run your code to replace the lesson trace.' });
            }
          }}
          options={{
            ...EDITOR_OPTIONS,
            readOnly,
            domReadOnly: readOnly,
            ariaLabel: `${meta.name} implementation in ${languageMeta.label}`,
          }}
        />
        {language === 'js' && (
          <div className="editor-caption">
            <span>Define <code>sort(a)</code>. Reads and writes become trace frames.</span>
            <span className="editor-badge">experiment</span>
          </div>
        )}
      </div>

      <div className="workbench-actions">
        {language === 'js' ? (
          <>
            <button
              type="button"
              className="btn btn-primary btn-run"
              onClick={handleRun}
              disabled={running}
            >
              {running ? 'Tracing…' : 'Run my code'}
              <span className="shortcut" aria-hidden="true">
                ↳
              </span>
            </button>
            <button type="button" className="btn btn-quiet" onClick={resetCode}>
              Reset code
            </button>
          </>
        ) : (
          <p className="reference-note">
            This {languageMeta.label} version mirrors the same trace. Switch to JS to experiment.
          </p>
        )}

        {customTrace && (
          <button type="button" className="btn btn-outline" onClick={onResetCustom}>
            Back to lesson trace
          </button>
        )}
      </div>

      {customTrace && (
        <div className={`custom-status ${customTrace.sorted ? 'is-sorted' : 'is-unsorted'}`}>
          <span className="custom-dot" aria-hidden="true" />
          <strong>Custom trace</strong>
          <span>
            {customTrace.sorted ? 'ascending ✓' : 'not ascending'} · {customTrace.steps.length} frames
          </span>
        </div>
      )}

      {runState.message && (
        <p className={`run-message status-${runState.status}`} role={runState.status === 'error' ? 'alert' : 'status'}>
          {runState.message}
        </p>
      )}

      <p className="sandbox-note">
        Runs in a local Web Worker with a 3-second cutoff. Network access is blocked. This is a
        learning sandbox, not a security boundary.
      </p>
    </section>
  );
}
