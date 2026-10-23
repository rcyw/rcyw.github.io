import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, LampDesk, RotateCcw } from 'lucide-react';
import App, { type DesktopEntry } from './App';
import type { SceneTarget, WorkbenchController } from './scene/types';
import './workbench.css';

const objects = [
  {
    id: 'agents',
    number: '01',
    label: 'AI / Agent',
    detail: 'A thought becomes an action.',
  },
  {
    id: 'sandbox',
    number: '02',
    label: 'Agent Sandbox',
    detail: 'Room to try. Boundaries to trust.',
  },
  {
    id: 'infra',
    number: '03',
    label: 'AI Infra',
    detail: 'The quiet machinery underneath.',
  },
] as const;

const objectLabels: Record<SceneTarget, string> = {
  desktop: 'Enter the desktop',
  agents: 'Explore AI / Agent',
  sandbox: 'Explore Agent Sandbox',
  infra: 'Explore AI Infra',
  notes: 'Read an open question',
  lamp: 'Switch the desk lamp',
};

const currentView = () =>
  window.location.hash === '#desktop' ? 'desktop' : 'workbench';

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

function StaticWorkbench() {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wb-wall" x2="0.8" y2="1">
          <stop stopColor="#263d3b" />
          <stop offset="1" stopColor="#101b1d" />
        </linearGradient>
        <linearGradient id="wb-table" x2="0.2" y2="1">
          <stop stopColor="#7d7967" />
          <stop offset="1" stopColor="#373a32" />
        </linearGradient>
        <linearGradient id="wb-monitor" x2="1" y2="1">
          <stop stopColor="#41484a" />
          <stop offset="1" stopColor="#141a1b" />
        </linearGradient>
        <radialGradient id="wb-light">
          <stop stopColor="#dba86a" stopOpacity=".3" />
          <stop offset="1" stopColor="#dba86a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#wb-wall)" />
      <path
        d="M810 55h490v455H810z"
        fill="#111f23"
        stroke="#4a5956"
        strokeWidth="15"
      />
      <path d="M1055 65v430M820 280h470" stroke="#3b4f4d" strokeWidth="9" />
      <g fill="#607b74" opacity=".3">
        <path d="M850 390h35v105h-35zM900 330h50v165h-50zM973 370h35v125h-35zM1090 355h40v140h-40zM1160 310h45v185h-45zM1230 380h37v115h-37z" />
      </g>
      <ellipse cx="420" cy="530" rx="550" ry="360" fill="url(#wb-light)" />
      <path
        d="m110 600 1070-60 250 205-1220 85z"
        fill="url(#wb-table)"
        stroke="#777866"
        strokeWidth="2"
      />
      <path d="m210 830 1220-85v31l-1220 90z" fill="#292d28" />
      <path
        d="m480 365 360 15 53 298-361 2z"
        fill="#0d1315"
        stroke="#616964"
        strokeWidth="3"
      />
      <path d="m510 363 320 17 35 252-335-8z" fill="url(#wb-monitor)" />
      <path d="m547 407 254 9 22 161-260-4z" fill="#718982" />
      <path d="m569 435 175 5 10 106-176-3z" fill="#eeeadd" />
      <path d="m569 435 175 5 3 17-176-4z" fill="#202d2a" />
      <text x="590" y="482" fill="#28372f" fontFamily="monospace" fontSize="15">
        A small desk.
      </text>
      <text x="590" y="510" fill="#28372f" fontFamily="monospace" fontSize="13">
        A lot of questions.
      </text>
      <path
        d="m430 475 35 3 12 192-145-7-8-169z"
        fill="#171d1f"
        stroke="#515956"
        strokeWidth="3"
      />
      <path d="m325 494 105-19 35 3-104 22z" fill="#343c3c" />
      <path
        d="m516 693 313-5 74 56-327 10z"
        fill="#272f2f"
        stroke="#747c72"
        strokeWidth="2"
      />
      <g stroke="#727c75" strokeWidth="8">
        <path d="m550 711 263-3M566 727l268-3M582 743l207-4" />
      </g>
      <path d="m952 623 53-18 58 38-54 19z" fill="#bfa274" />
      <path d="m952 623 57 39v44l-57-39z" fill="#807b5e" />
      <path d="m1009 662 54-19v44l-54 19z" fill="#354c43" />
      <g stroke="#b6d4b5" strokeWidth="2" fill="#a2cfba" fillOpacity=".1">
        <path d="m1105 583 60-18 51 39v86l-60 20-51-43z" />
        <path d="m1105 583 51 39 60-18M1156 622v88" />
      </g>
      <path
        d="m1245 613 74 31v99l-74-37z"
        fill="#253c3d"
        stroke="#74877d"
        strokeWidth="2"
      />
      <g stroke="#b3d1ba" strokeWidth="3">
        <path d="m1254 636 54 22m-54 6 54 23m-54 4 54 23" />
      </g>
      <path
        d="m250 578 12-211 80-72"
        fill="none"
        stroke="#8b8674"
        strokeWidth="12"
      />
      <path d="m304 309 56-47 48 76z" fill="#d8b683" />
      <ellipse cx="246" cy="589" rx="65" ry="16" fill="#8b8674" />
    </svg>
  );
}

export default function Workstation() {
  const [view, setView] = useState(currentView);
  const [hasEntered, setHasEntered] = useState(view === 'desktop');
  const [entry, setEntry] = useState<DesktopEntry>();
  const [lampOn, setLampOn] = useState(true);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>(
    'loading',
  );
  const [hovered, setHovered] = useState<SceneTarget | null>(null);
  const [entering, setEntering] = useState(false);
  const reducedMotion = useReducedMotion();
  const canvasHost = useRef<HTMLDivElement>(null);
  const controller = useRef<WorkbenchController | null>(null);
  const enterButton = useRef<HTMLButtonElement>(null);
  const transition = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const busy = useRef(false);
  const sequence = useRef(0);
  const transitionVersion = useRef(0);
  const selectHandler = useRef<(target: SceneTarget) => void>(() => {});
  const previousView = useRef(view);

  useEffect(() => {
    const navigate = () => {
      cancelEntry();
      const next = currentView();
      if (next === 'desktop') setHasEntered(true);
      setView(next);
    };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);

  useEffect(() => {
    if (previousView.current !== view) {
      window.scrollTo(0, 0);
      if (view === 'workbench')
        requestAnimationFrame(() =>
          enterButton.current?.focus({ preventScroll: true }),
        );
    }
    previousView.current = view;
  }, [view]);

  useEffect(() => {
    if (view !== 'workbench') return;
    const host = canvasHost.current;
    if (!host) return;
    let cancelled = false;
    let instance: WorkbenchController | null = null;
    setStatus('loading');
    setHovered(null);
    const fail = () => {
      if (cancelled) return;
      setStatus('fallback');
      setHovered(null);
      controller.current?.dispose();
      controller.current = null;
    };
    import('./scene/workbenchScene')
      .then(({ createWorkbench }) => {
        if (cancelled) return;
        try {
          instance = createWorkbench(host, {
            onSelect: (target) => selectHandler.current(target),
            onHover: setHovered,
            onReady: () => {
              if (!cancelled) setStatus('ready');
            },
            onError: fail,
            reducedMotion,
            lampOn,
          });
          if (cancelled) instance.dispose();
          else controller.current = instance;
        } catch {
          fail();
        }
      })
      .catch(fail);
    return () => {
      cancelled = true;
      instance?.dispose();
      controller.current = null;
    };
    // Lamp updates use the controller without rebuilding the scene.
  }, [view, reducedMotion]);

  useEffect(() => {
    controller.current?.setLamp(lampOn);
  }, [lampOn]);
  useEffect(
    () => () => {
      transitionVersion.current += 1;
      clearTimeout(transition.current);
    },
    [],
  );

  function cancelEntry() {
    transitionVersion.current += 1;
    clearTimeout(transition.current);
    if (busy.current) controller.current?.reset();
    busy.current = false;
    setEntering(false);
  }

  function enter(target: SceneTarget = 'desktop', directly = false) {
    if (busy.current) return;
    const version = ++transitionVersion.current;
    busy.current = true;
    setEntering(true);
    const nextEntry: DesktopEntry | undefined =
      target === 'agents' || target === 'sandbox' || target === 'infra'
        ? { sequence: ++sequence.current, app: 'interests', topic: target }
        : target === 'notes'
          ? { sequence: ++sequence.current, app: 'notes' }
          : undefined;
    let finished = false;
    const finish = () => {
      if (finished || version !== transitionVersion.current) return;
      finished = true;
      clearTimeout(transition.current);
      setEntry(nextEntry);
      setHasEntered(true);
      window.location.hash = 'desktop';
      setView('desktop');
      setEntering(false);
      busy.current = false;
    };
    if (directly || reducedMotion || !controller.current || status !== 'ready')
      finish();
    else {
      transition.current = setTimeout(finish, 1100);
      try {
        controller.current.enter(finish);
      } catch {
        finish();
      }
    }
  }

  selectHandler.current = (target) => {
    if (target === 'lamp') setLampOn((value) => !value);
    else enter(target);
  };

  function returnToWorkbench() {
    cancelEntry();
    setEntry(undefined);
    window.location.hash = 'workbench';
  }

  return (
    <div className="wb-experience">
      {view === 'workbench' && (
        <main
          className={`wb-room ${entering ? 'is-entering' : ''}`}
          aria-label="Workbench"
          data-scene-status={status}
        >
          <a
            className="wb-access-link"
            href="#desktop"
            onClick={(event) => {
              event.preventDefault();
              enter('desktop', true);
            }}
          >
            Skip to the desktop
          </a>
          <div
            className="wb-fallback"
            aria-hidden="true"
            hidden={status === 'ready'}
          >
            <StaticWorkbench />
          </div>
          <div className="wb-canvas" ref={canvasHost} aria-hidden="true" />
          <div className="wb-vignette" aria-hidden="true" />
          <header className="wb-header">
            <a
              className="wb-brand"
              href="#workbench"
              aria-label="Wayne's workbench"
              onClick={(event) => {
                event.preventDefault();
                returnToWorkbench();
              }}
            >
              <span className="wb-brand-mark">01</span>
              <span>
                <strong>rcyw</strong>
                <small>curiosity desk</small>
              </span>
            </a>
            <div className="wb-header-actions">
              <span className="wb-room-label">PERSONAL WORKSPACE</span>
              <button
                className="wb-enter"
                type="button"
                ref={enterButton}
                disabled={entering}
                onClick={() => enter()}
              >
                Enter desktop
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            </div>
          </header>
          <section className="wb-intro" aria-labelledby="workbench-heading">
            <p className="wb-kicker">
              <span aria-hidden="true" />
              WAYNE / RCYW
            </p>
            <h1 id="workbench-heading">
              A small desk.
              <br />
              <span>A lot of questions.</span>
            </h1>
            <p className="wb-intro-copy">
              AI, agents, and the systems underneath.
              <br />
              Pick something up. Follow a thread.
            </p>
          </section>
          {status === 'loading' && (
            <p className="wb-scene-status" role="status">
              Setting the desk…
            </p>
          )}
          {status === 'fallback' && (
            <p className="wb-scene-status" role="status">
              A quieter view. The whole desk is still open.
            </p>
          )}
          <div className="wb-hover-label" aria-hidden="true">
            {hovered ? (
              <>
                <ArrowRight size={14} />
                {objectLabels[hovered]}
              </>
            ) : null}
          </div>
          <div className="wb-bottom">
            <nav className="wb-object-nav" aria-label="Explore interests">
              {objects.map((object) => (
                <button
                  type="button"
                  className="wb-object"
                  key={object.id}
                  aria-label={object.label}
                  disabled={entering}
                  onClick={() => enter(object.id)}
                  onPointerEnter={() =>
                    controller.current?.setHighlight(object.id)
                  }
                  onPointerLeave={() => controller.current?.setHighlight(null)}
                  onFocus={() => controller.current?.setHighlight(object.id)}
                  onBlur={() => controller.current?.setHighlight(null)}
                >
                  <span className="wb-object-number">{object.number}</span>
                  <span className="wb-object-copy">
                    <strong>{object.label}</strong>
                    <small>{object.detail}</small>
                  </span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </button>
              ))}
            </nav>
            <footer className="wb-footline">
              <p className="wb-instructions">
                {status === 'ready'
                  ? 'Drag gently to look around. Click an object to explore.'
                  : 'Choose a thread, or step into the desktop.'}
              </p>
              <div className="wb-controls">
                <button
                  className="wb-control"
                  type="button"
                  aria-label="Toggle desk lamp"
                  aria-pressed={lampOn}
                  onClick={() => setLampOn((value) => !value)}
                  disabled={status !== 'ready' || entering}
                >
                  <LampDesk size={15} aria-hidden="true" />
                  <span>Lamp {lampOn ? 'on' : 'off'}</span>
                </button>
                <button
                  className="wb-control"
                  type="button"
                  onClick={() => controller.current?.reset()}
                  disabled={status !== 'ready' || entering}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  Reset view
                </button>
                <a
                  href="https://github.com/rcyw"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                  <ArrowUpRight size={13} aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </footer>
          </div>
        </main>
      )}
      {hasEntered && (
        <div
          className="wb-desktop"
          hidden={view !== 'desktop'}
          inert={view !== 'desktop'}
        >
          <App
            active={view === 'desktop'}
            entry={entry}
            onReturn={returnToWorkbench}
          />
        </div>
      )}
    </div>
  );
}
