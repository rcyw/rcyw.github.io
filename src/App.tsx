import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Minus,
  Network,
  NotebookPen,
  Shield,
  Terminal,
  UserRound,
  X,
} from 'lucide-react';
import CuriosityTerminal from './components/CuriosityTerminal';
import {
  defaultState,
  introduction,
  questions,
  STORAGE_KEY,
  topicIds,
  topics,
  validateDesktopState,
  viewNames,
  type AppId,
  type DesktopState,
  type TopicId,
} from './content';
import './styles.css';

const apps = [
  { id: 'about', label: 'About', icon: UserRound },
  { id: 'interests', label: 'Interests', icon: FolderOpen },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'notes', label: 'Notes', icon: NotebookPen },
] as const;

const topicIcons = { agents: Bot, sandbox: Shield, infra: Network };

function initialState(): DesktopState {
  try {
    return validateDesktopState(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'),
    );
  } catch {
    return { ...defaultState };
  }
}

export interface DesktopEntry {
  sequence: number;
  app: AppId;
  topic?: TopicId;
}

interface DesktopProps {
  active?: boolean;
  entry?: DesktopEntry;
  onReturn?: () => void;
}

export default function App({ active = true, entry, onReturn }: DesktopProps) {
  const [state, setState] = useState<DesktopState>(initialState);
  const [activeWindow, setActiveWindow] = useState<'main' | 'notes' | null>(
    state.minimized ? (state.noteVisible ? 'notes' : null) : 'main',
  );
  const [time, setTime] = useState(() => new Date());
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const activeRef = useRef(active);
  activeRef.current = active;
  const handledEntry = useRef<number | undefined>(undefined);
  const mainWindow = useRef<HTMLElement>(null);
  const noteWindow = useRef<HTMLElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
  } | null>(null);
  const view = viewNames[state.view];
  const topic = topics[state.topic];
  const question = questions[state.noteIndex]!;
  const MainIcon = apps.find((app) => app.id === state.view)!.icon;

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(validateDesktopState(state)),
      );
    } catch {
      // The desk remains usable when browser storage is unavailable.
    }
  }, [state]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const resize = () => {
      setOffset({ x: 0, y: 0 });
      drag.current = null;
      setDragging(false);
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  function focusApp(app: AppId) {
    requestAnimationFrame(() => {
      if (!activeRef.current) return;
      const element = app === 'notes' ? noteWindow.current : mainWindow.current;
      if (app === 'terminal')
        element
          ?.querySelector<HTMLInputElement>('#terminal-command')
          ?.focus({ preventScroll: true });
      else element?.focus({ preventScroll: true });
      if (window.innerWidth <= 760)
        element?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    });
  }

  function openApp(app: AppId) {
    if (app === 'notes') {
      setState((current) => ({ ...current, noteVisible: true }));
      setActiveWindow('notes');
      setAnnouncement('Questions note opened.');
    } else {
      setState((current) => ({
        ...current,
        view: app,
        minimized: false,
        folded: false,
      }));
      setActiveWindow('main');
      setAnnouncement(`${apps.find((item) => item.id === app)!.label} opened.`);
    }
    focusApp(app);
  }

  function openTopic(id: TopicId) {
    setState((current) => ({
      ...current,
      view: 'interests',
      topic: id,
      minimized: false,
      folded: false,
    }));
    setActiveWindow('main');
    focusApp('interests');
  }

  useEffect(() => {
    if (!active) return;
    if (entry && handledEntry.current !== entry.sequence) {
      handledEntry.current = entry.sequence;
      if (entry.topic) openTopic(entry.topic);
      else openApp(entry.app);
      return;
    }
    const frame = requestAnimationFrame(() => {
      if (!activeRef.current) return;
      if (state.minimized) {
        dock.current
          ?.querySelector<HTMLButtonElement>(`[data-app="${state.view}"]`)
          ?.focus({ preventScroll: true });
      } else if (state.folded) {
        mainWindow.current?.focus({ preventScroll: true });
      } else {
        focusApp(state.view);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [active, entry]);

  function closeNote() {
    setState((current) => ({ ...current, noteVisible: false }));
    setActiveWindow(state.minimized ? null : 'main');
    dock.current
      ?.querySelector<HTMLButtonElement>('[data-app="notes"]')
      ?.focus();
    setAnnouncement('Questions note put away. Open Notes to bring it back.');
  }

  function minimize() {
    setState((current) => ({ ...current, minimized: true }));
    setActiveWindow(state.noteVisible ? 'notes' : null);
    dock.current
      ?.querySelector<HTMLButtonElement>(`[data-app="${state.view}"]`)
      ?.focus();
    setAnnouncement('Window put on the shelf. Open it again from the Dock.');
  }

  function startDrag(event: PointerEvent<HTMLElement>) {
    if (
      event.button !== 0 ||
      event.pointerType !== 'mouse' ||
      window.innerWidth <= 900
    )
      return;
    if ((event.target as HTMLElement).closest('button')) return;
    const frame = mainWindow.current?.getBoundingClientRect();
    const area = workspace.current?.getBoundingClientRect();
    if (!frame || !area) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      startX: offset.x,
      startY: offset.y,
      left: area.left + 4 - frame.left + offset.x,
      right: Math.max(
        area.left + 4 - frame.left + offset.x,
        area.right - 4 - frame.right + offset.x,
      ),
      top: 44 - frame.top + offset.y,
      bottom: Math.max(
        44 - frame.top + offset.y,
        window.innerHeight - 24 - frame.bottom + offset.y,
      ),
    };
    setDragging(true);
  }

  function moveDrag(event: PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current) return;
    setOffset({
      x: Math.max(
        current.left,
        Math.min(current.right, current.startX + event.clientX - current.x),
      ),
      y: Math.max(
        current.top,
        Math.min(current.bottom, current.startY + event.clientY - current.y),
      ),
    });
  }

  function endDrag(event: PointerEvent<HTMLElement>) {
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className="desktop">
      <a
        className="skip-link"
        href="#main-window"
        onClick={(event) => {
          event.preventDefault();
          openApp(state.view);
        }}
      >
        Skip to the open window
      </a>
      <header className="system-bar">
        <div className="system-identity">
          <span className="system-mark" aria-hidden="true">
            ◆
          </span>
          <strong>Workspace</strong>
          <span className="system-divider" />
          <span className="system-owner">Wayne's desk</span>
        </div>
        <div className="system-right">
          {onReturn && (
            <button type="button" className="wb-return" onClick={onReturn}>
              <ArrowLeft size={13} aria-hidden="true" />
              Back to workbench
            </button>
          )}
          <span className="desktop-presence">
            <span aria-hidden="true" />
            Curiosity: on
          </span>
          <time dateTime={time.toISOString()} title="Your local time">
            {new Intl.DateTimeFormat('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }).format(time)}
          </time>
        </div>
      </header>

      <main className="desktop-surface">
        <div className="workspace" ref={workspace}>
          <header className="workspace-heading">
            <button
              className="workspace-clip bevel"
              type="button"
              aria-label="Workspace 01 — return to About"
              onClick={() => openApp('about')}
            >
              <span className="clip-corner" aria-hidden="true" />
              <strong>01</strong>
              <span>rcyw</span>
            </button>
            <div>
              <p className="workspace-name">Wayne's desk</p>
              <p className="workspace-subtitle">
                Personal notes &amp; open questions
              </p>
            </div>
            <span className="workspace-number" aria-hidden="true">
              A place to follow a thread.
            </span>
          </header>

          <div className="window-area">
            <section
              id="main-window"
              aria-label="Main window"
              tabIndex={-1}
              ref={mainWindow}
              hidden={state.minimized}
              className={`window main-window ${activeWindow === 'main' ? 'is-active' : ''} ${dragging ? 'is-dragging' : ''} ${state.folded ? 'is-folded' : ''}`}
              style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
              onPointerDownCapture={() => setActiveWindow('main')}
            >
              <header
                className="window-titlebar draggable-title"
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <MainIcon size={17} strokeWidth={1.6} aria-hidden="true" />
                <span className="window-title">{view.title}</span>
                <button
                  type="button"
                  className="window-control bevel"
                  aria-label={state.folded ? 'Expand window' : 'Fold window'}
                  aria-expanded={!state.folded}
                  aria-controls="main-window-body"
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      folded: !current.folded,
                    }))
                  }
                >
                  {state.folded ? (
                    <ChevronDown size={17} aria-hidden="true" />
                  ) : (
                    <ChevronUp size={17} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  className="window-control bevel"
                  aria-label="Minimize window"
                  onClick={minimize}
                >
                  <Minus size={17} aria-hidden="true" />
                </button>
              </header>
              <div id="main-window-body" hidden={state.folded}>
                <div className="location-bar">
                  <span className="location-square" aria-hidden="true" />
                  <span>{view.path}</span>
                  <span className="location-kind">
                    {state.view === 'interests'
                      ? 'folder'
                      : state.view === 'about'
                        ? 'plain text'
                        : 'interactive'}
                  </span>
                </div>

                <article
                  className="paper document-panel about-document"
                  hidden={state.view !== 'about'}
                  aria-labelledby="about-heading"
                >
                  <p className="eyebrow">
                    <span className="tiny-square" aria-hidden="true" />
                    {introduction.greeting}
                  </p>
                  <h1 id="about-heading">
                    {introduction.headline[0]}
                    <br />
                    <span>{introduction.headline[1]}</span>
                  </h1>
                  {introduction.paragraphs.map((paragraph) => (
                    <p className="document-copy" key={paragraph}>
                      {paragraph}
                    </p>
                  ))}
                  <button
                    type="button"
                    className="desktop-button bevel open-drawer"
                    onClick={() => openApp('interests')}
                  >
                    <FolderOpen size={17} aria-hidden="true" />
                    Open the curiosity drawer
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                  <div className="document-postscript">
                    <span className="postscript-rule" />
                    <p>{introduction.postscript}</p>
                    <span className="paper-folio">01</span>
                  </div>
                </article>

                <article
                  className="paper document-panel interests-document"
                  hidden={state.view !== 'interests'}
                  aria-labelledby="interests-heading"
                >
                  <p className="eyebrow">
                    ~/curiosities/{' '}
                    <span className="eyebrow-end">3 drawers</span>
                  </p>
                  <h1 id="interests-heading">Follow a thread.</h1>
                  <div
                    className="topic-drawers"
                    role="group"
                    aria-label="Curiosity drawers"
                  >
                    {topicIds.map((id) => {
                      const Icon = topicIcons[id];
                      return (
                        <button
                          type="button"
                          key={id}
                          className="topic-drawer bevel"
                          aria-pressed={state.topic === id}
                          onClick={() =>
                            setState((current) => ({ ...current, topic: id }))
                          }
                        >
                          <Icon
                            size={17}
                            strokeWidth={1.6}
                            aria-hidden="true"
                          />
                          <span>{topics[id].label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <section
                    className="topic-detail"
                    role="region"
                    aria-label="Selected topic"
                    aria-live="polite"
                  >
                    <p className="eyebrow topic-number">
                      DRAWER {topic.number}
                    </p>
                    <h2>{topic.heading}</h2>
                    <p className="document-copy">{topic.description}</p>
                    <p className="document-copy topic-extra">{topic.detail}</p>
                    <ul className="topic-tags" aria-label="Threads to follow">
                      {topic.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="question-link"
                      onClick={() => {
                        setState((current) => ({
                          ...current,
                          noteVisible: true,
                          noteIndex: questions.findIndex(
                            (item) => item.text === topic.question,
                          ),
                        }));
                        setActiveWindow('notes');
                        focusApp('notes');
                      }}
                    >
                      <NotebookPen size={16} aria-hidden="true" />
                      <span>{topic.question}</span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </button>
                  </section>
                </article>

                <div
                  hidden={state.view !== 'terminal'}
                  className="terminal-panel"
                >
                  <CuriosityTerminal
                    questionIndex={state.noteIndex}
                    onOpen={openApp}
                    onTopic={openTopic}
                    active={
                      active &&
                      state.view === 'terminal' &&
                      !state.folded &&
                      !state.minimized
                    }
                  />
                </div>
                <footer className="window-status">
                  <span>{view.status}</span>
                  <span>
                    <span className="status-dot" aria-hidden="true" />
                    curiosity: on
                  </span>
                </footer>
              </div>
            </section>

            {state.minimized && (
              <div className="empty-desk">
                <button
                  type="button"
                  className="shelf-window bevel"
                  onClick={() => openApp(state.view)}
                >
                  <MainIcon size={28} strokeWidth={1.3} aria-hidden="true" />
                  <span>{view.title}</span>
                  <small>Bring back to desk</small>
                </button>
              </div>
            )}

            <aside
              className={`window question-window ${activeWindow === 'notes' ? 'is-active' : ''}`}
              aria-label="Questions note"
              tabIndex={-1}
              ref={noteWindow}
              hidden={!state.noteVisible}
              onPointerDownCapture={() => setActiveWindow('notes')}
            >
              <header className="window-titlebar">
                <NotebookPen size={16} strokeWidth={1.6} aria-hidden="true" />
                <span className="window-title">questions.txt</span>
                <button
                  type="button"
                  className="window-control bevel"
                  aria-label="Close questions note"
                  onClick={closeNote}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </header>
              <div className="question-paper">
                <div className="note-eyebrow">
                  <span>A question on my desk</span>
                  <span>
                    {String(state.noteIndex + 1).padStart(2, '0')} /{' '}
                    {String(questions.length).padStart(2, '0')}
                  </span>
                </div>
                <p
                  className="note-question"
                  data-testid="current-question"
                  aria-live="polite"
                >
                  {question.text}
                </p>
                <p className="note-afterthought">Still worth thinking about.</p>
                <button
                  className="note-topic"
                  type="button"
                  aria-label={`Open ${topics[question.topic].label} drawer`}
                  onClick={() => openTopic(question.topic)}
                >
                  {topics[question.topic].label}
                  <ArrowUpRight size={13} aria-hidden="true" />
                </button>
              </div>
              <footer className="note-footer">
                <button
                  type="button"
                  className="desktop-button bevel"
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      noteIndex: (current.noteIndex + 1) % questions.length,
                    }))
                  }
                >
                  Another question
                  <ArrowUpRight size={15} aria-hidden="true" />
                </button>
              </footer>
            </aside>
          </div>
          <footer className="desktop-footer">
            <span>One question leads to another.</span>
            <div>
              <a
                href="https://github.com/rcyw"
                target="_blank"
                rel="noopener noreferrer"
              >
                <UserRound size={14} aria-hidden="true" />
                rcyw
                <ArrowUpRight size={12} aria-hidden="true" />
                <span className="sr-only"> on GitHub (opens in a new tab)</span>
              </a>
              <span className="footer-separator" aria-hidden="true">
                /
              </span>
              <a
                href="https://github.com/cofy-x"
                target="_blank"
                rel="noopener noreferrer"
              >
                cofy-x
                <ArrowUpRight size={12} aria-hidden="true" />
                <span className="sr-only"> on GitHub (opens in a new tab)</span>
              </a>
            </div>
          </footer>
        </div>

        <nav className="dock" aria-label="Desktop applications" ref={dock}>
          <div className="dock-cap" aria-hidden="true">
            <span>rcyw</span>
          </div>
          {apps.map((app) => {
            const selected =
              app.id === 'notes'
                ? state.noteVisible && activeWindow === 'notes'
                : !state.minimized &&
                  state.view === app.id &&
                  activeWindow === 'main';
            const running =
              app.id === 'notes'
                ? state.noteVisible
                : !state.minimized && state.view === app.id;
            const Icon = app.icon;
            return (
              <button
                type="button"
                key={app.id}
                className={`dock-app bevel ${selected ? 'is-selected' : ''}`}
                data-app={app.id}
                aria-pressed={selected}
                onClick={() => openApp(app.id)}
              >
                <span className="dock-icon">
                  <Icon size={31} strokeWidth={1.35} aria-hidden="true" />
                </span>
                <span>{app.label}</span>
                <span
                  className={`dock-running ${running ? 'is-running' : ''}`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
          <span className="dock-foot" aria-hidden="true">
            ◆
          </span>
        </nav>
      </main>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
