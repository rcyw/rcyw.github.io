export const STORAGE_KEY = 'rcyw.curiosity-desktop.v1';

export const views = ['about', 'interests', 'terminal'] as const;
export type ViewId = (typeof views)[number];
export type TopicId = 'agents' | 'sandbox' | 'infra';
export type AppId = ViewId | 'notes';

export interface DesktopState {
  version: 1;
  view: ViewId;
  topic: TopicId;
  noteIndex: number;
  noteVisible: boolean;
  folded: boolean;
  minimized: boolean;
}

export const defaultState: DesktopState = {
  version: 1,
  view: 'about',
  topic: 'agents',
  noteIndex: 0,
  noteVisible: true,
  folded: false,
  minimized: false,
};

export const introduction = {
  greeting: "Hi, I'm Wayne. Also rcyw.",
  headline: ['A small desk.', 'A lot of questions.'],
  paragraphs: [
    "I'm interested in AI / Agent, Agent Sandbox, and AI Infra — the systems that let an idea do something useful.",
    'I like following a question past the interface, into the machinery underneath.',
  ],
  postscript: 'There is usually another layer to explore.',
};

export const topics = {
  agents: {
    label: 'AI / Agent',
    number: '01',
    heading: 'Intelligence that can do things.',
    description:
      'Tools, memory, feedback — and the space between an instruction and an action.',
    detail:
      'An interesting loop: notice something, make a choice, try a tool, and learn what happened.',
    tags: ['Tools', 'Memory', 'Feedback'],
    question: 'What should an agent remember?',
  },
  sandbox: {
    label: 'Agent Sandbox',
    number: '02',
    heading: 'A little room to try things.',
    description:
      'A place for agents to act, with boundaries around what they can touch.',
    detail:
      'Execution environments, isolation, and the small decisions that make experimentation possible.',
    tags: ['Boundaries', 'Isolation', 'Execution'],
    question: 'Where does a sandbox draw the line?',
  },
  infra: {
    label: 'AI Infra',
    number: '03',
    heading: 'The machinery underneath.',
    description:
      'The systems that give an idea somewhere to run, somewhere to keep state, and a way to keep going.',
    detail:
      'Queues, storage, observability, and all the quiet pieces between a useful experiment and a reliable system.',
    tags: ['State', 'Observability', 'Reliability'],
    question: 'What happens after something fails?',
  },
} satisfies Record<
  TopicId,
  {
    label: string;
    number: string;
    heading: string;
    description: string;
    detail: string;
    tags: string[];
    question: string;
  }
>;

export const topicIds: TopicId[] = ['agents', 'sandbox', 'infra'];

export const questions: { text: string; topic: TopicId }[] = [
  { text: topics.agents.question, topic: 'agents' },
  { text: topics.sandbox.question, topic: 'sandbox' },
  { text: topics.infra.question, topic: 'infra' },
  {
    text: 'Which parts should be shared, and which should stay isolated?',
    topic: 'sandbox',
  },
  { text: 'How do you know an agent did the right thing?', topic: 'agents' },
  { text: 'Which layer should we look at next?', topic: 'infra' },
];

export const viewNames: Record<
  ViewId,
  { title: string; path: string; status: string }
> = {
  about: {
    title: 'about.txt',
    path: '~/rcyw/about.txt',
    status: 'Personal notes',
  },
  interests: {
    title: 'curiosities/',
    path: '~/rcyw/curiosities/',
    status: 'Three open drawers',
  },
  terminal: { title: 'Terminal', path: '~/rcyw', status: 'Explore with help' },
};

export function validateDesktopState(value: unknown): DesktopState {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return { ...defaultState };
  const saved = value as Record<string, unknown>;
  if (saved.version !== 1) return { ...defaultState };
  return {
    version: 1,
    view: views.includes(saved.view as ViewId)
      ? (saved.view as ViewId)
      : defaultState.view,
    topic: topicIds.includes(saved.topic as TopicId)
      ? (saved.topic as TopicId)
      : defaultState.topic,
    noteIndex:
      typeof saved.noteIndex === 'number' &&
      Number.isInteger(saved.noteIndex) &&
      saved.noteIndex >= 0 &&
      saved.noteIndex < questions.length
        ? saved.noteIndex
        : defaultState.noteIndex,
    noteVisible:
      typeof saved.noteVisible === 'boolean'
        ? saved.noteVisible
        : defaultState.noteVisible,
    folded:
      typeof saved.folded === 'boolean' ? saved.folded : defaultState.folded,
    minimized:
      typeof saved.minimized === 'boolean'
        ? saved.minimized
        : defaultState.minimized,
  };
}
