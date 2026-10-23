import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { questions, topics, type AppId, type TopicId } from '../content';

interface Entry {
  id: number;
  command?: string;
  output: string;
}

interface Props {
  questionIndex: number;
  onOpen: (app: AppId) => void;
  onTopic: (topic: TopicId) => void;
  active: boolean;
}

const help = [
  'whoami         a short introduction',
  'interests      what I am curious about',
  'ls             look inside the desk',
  'why            read the question on the desk',
  'open [name]    about, interests, notes, terminal',
  'clear          make a little room',
].join('\n');

export default function CuriosityTerminal({
  questionIndex,
  onOpen,
  onTopic,
  active,
}: Props) {
  const [entries, setEntries] = useState<Entry[]>([
    { id: 0, output: "Wayne's desk\nType help to look around." },
  ]);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const historyPosition = useRef(0);
  const nextId = useRef(1);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [active, entries]);

  function run() {
    const input = command.trim();
    if (!input) return;
    const normalized = input.toLowerCase().replace(/\s+/g, ' ');
    const nextHistory = [...history, input].slice(-30);
    setHistory(nextHistory);
    historyPosition.current = nextHistory.length;
    setCommand('');
    if (normalized === 'clear') {
      setEntries([]);
      return;
    }

    let output: string;
    switch (normalized) {
      case 'help':
        output = help;
        break;
      case 'whoami':
        output =
          'Wayne / rcyw\nCurious about AI / Agent, Agent Sandbox, and AI Infra.';
        break;
      case 'interests':
        output =
          '01  AI / Agent\n02  Agent Sandbox\n03  AI Infra\n\nTry open interests to follow a thread.';
        break;
      case 'ls':
      case 'ls -a':
        output = 'about.txt\ncuriosities/\nquestions.txt\nterminal';
        break;
      case 'why':
        output = `${questions[questionIndex]!.text}\n\nStill worth thinking about.`;
        break;
      case 'pwd':
        output = '~/rcyw';
        break;
      case 'sudo':
      case 'sudo help':
        output = 'Curiosity needs no sudo.';
        break;
      case 'ping':
        output = 'pong. Still here.';
        break;
      default: {
        if (normalized === 'open' || normalized.startsWith('open ')) {
          const destination = normalized.slice(5).trim() || 'interests';
          const destinations: Record<string, AppId> = {
            about: 'about',
            'about.txt': 'about',
            interests: 'interests',
            curiosities: 'interests',
            'curiosities/': 'interests',
            notes: 'notes',
            'questions.txt': 'notes',
            terminal: 'terminal',
          };
          const topicDestinations: Record<string, TopicId> = {
            agents: 'agents',
            sandbox: 'sandbox',
            infra: 'infra',
          };
          if (Object.hasOwn(destinations, destination)) {
            output = `Opening ${destination}.`;
            onOpen(destinations[destination]!);
          } else if (Object.hasOwn(topicDestinations, destination)) {
            const topic = topicDestinations[destination]!;
            output = `Opening ${topics[topic].label}.`;
            onTopic(topic);
          } else {
            output = 'No such drawer. Try open interests or open notes.';
          }
        } else {
          output = `No entry for “${input}”.\nType help for a few places to start.`;
        }
      }
    }
    setEntries((current) =>
      [...current, { id: nextId.current++, command: input, output }].slice(-16),
    );
  }

  return (
    <section className="terminal-paper" aria-label="Curiosity terminal">
      <div className="terminal-heading">
        <span className="terminal-led" aria-hidden="true" />
        <span>curiosity shell</span>
        <span className="terminal-hint">a few ways to look around</span>
      </div>
      <div
        className="terminal-output"
        ref={log}
        role="log"
        aria-label="Terminal output"
        tabIndex={0}
        aria-live="polite"
        aria-relevant="additions"
      >
        {entries.map((entry) => (
          <div className="terminal-entry" key={entry.id}>
            {entry.command && (
              <p className="terminal-echo">
                <span aria-hidden="true">% </span>
                {entry.command}
              </p>
            )}
            <p>{entry.output}</p>
          </div>
        ))}
      </div>
      <form
        className="terminal-command"
        onSubmit={(event) => {
          event.preventDefault();
          run();
        }}
      >
        <label htmlFor="terminal-command" className="sr-only">
          Terminal command
        </label>
        <span className="terminal-prompt" aria-hidden="true">
          rcyw@desk ~ %
        </span>
        <input
          id="terminal-command"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={160}
          placeholder="help"
          enterKeyHint="send"
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) {
              if (event.key === 'Enter') event.preventDefault();
              return;
            }
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
            event.preventDefault();
            historyPosition.current = Math.max(
              0,
              Math.min(
                history.length,
                historyPosition.current + (event.key === 'ArrowUp' ? -1 : 1),
              ),
            );
            setCommand(history[historyPosition.current] ?? '');
          }}
        />
        <button type="submit" className="terminal-run" aria-label="Run command">
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}
