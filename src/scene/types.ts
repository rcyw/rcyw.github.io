export type SceneTarget =
  'desktop' | 'agents' | 'sandbox' | 'infra' | 'notes' | 'lamp';

export interface WorkbenchOptions {
  onSelect(target: SceneTarget): void;
  onHover(target: SceneTarget | null): void;
  onReady(): void;
  onError(): void;
  reducedMotion: boolean;
  lampOn: boolean;
}

export interface WorkbenchController {
  dispose(): void;
  setLamp(on: boolean): void;
  reset(): void;
  setHighlight(target: SceneTarget | null): void;
  enter(onComplete: () => void): void;
}
