export type SceneTarget =
  'desktop' | 'agents' | 'sandbox' | 'infra' | 'notes' | 'lamp';

export interface SceneAnchor {
  target: 'desktop' | 'agents' | 'sandbox' | 'infra';
  /** Coordinates in percent of the canvas host. */
  x: number;
  y: number;
  visible: boolean;
}

export interface WorkbenchOptions {
  onSelect(target: SceneTarget): void;
  onHover(target: SceneTarget | null): void;
  onAnchors(anchors: SceneAnchor[]): void;
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
