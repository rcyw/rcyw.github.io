import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { SceneTarget } from './types';

export interface WorkbenchModels {
  root: THREE.Group;
  pickables: THREE.Object3D[];
  screenCenter: THREE.Vector3;
  setLamp(on: boolean): void;
  setHighlight(target: SceneTarget | null): void;
}

const palette = {
  graphite: '#292d2d',
  edge: '#414747',
  rubber: '#151b1b',
  ivory: '#d9d9c9',
  mint: '#a7cbb8',
  amber: '#f0be75',
};

function material(color: string, roughness = 0.65, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function box(
  parent: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  surface: THREE.Material,
  radius = 0.025,
) {
  const mesh = new THREE.Mesh(
    radius > 0
      ? new RoundedBoxGeometry(...size, 2, radius)
      : new THREE.BoxGeometry(...size),
    surface,
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(
  parent: THREE.Object3D,
  radius: number,
  height: number,
  position: [number, number, number],
  surface: THREE.Material,
  topRadius = radius,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(topRadius, radius, height, 32),
    surface,
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cable(parent: THREE.Object3D, points: number[][], thickness = 0.014) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(point[0], point[1], point[2])),
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 30, thickness, 6, false),
    material('#161e1b', 0.92),
  );
  mesh.castShadow = true;
  parent.add(mesh);
}

function texture(
  width: number,
  height: number,
  paint: (context: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The workbench needs a 2D canvas.');
  paint(context);
  const result = new THREE.CanvasTexture(canvas);
  result.colorSpace = THREE.SRGBColorSpace;
  result.anisotropy = 4;
  return result;
}

function label(
  parent: THREE.Object3D,
  text: string,
  width: number,
  height: number,
  position: [number, number, number],
  color = '#ced7c7',
  background = '#262f2c',
) {
  const map = texture(512, 96, (context) => {
    context.fillStyle = background;
    context.fillRect(0, 0, 512, 96);
    context.fillStyle = color;
    context.font = '500 34px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 256, 50);
  });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map, toneMapped: false }),
  );
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function desktopTexture() {
  return texture(1024, 768, (context) => {
    context.fillStyle = '#5b6968';
    context.fillRect(0, 0, 1024, 768);
    context.fillStyle = '#8d9890';
    for (let x = 1; x < 1024; x += 8)
      for (let y = 1; y < 768; y += 8) context.fillRect(x, y, 1, 1);
    context.fillStyle = '#c8ccc2';
    context.fillRect(0, 0, 1024, 34);
    context.fillStyle = '#1d2925';
    context.font = 'bold 17px monospace';
    context.fillText('◆  Workspace   /   Wayne’s desk', 18, 23);
    context.fillText('rcyw', 930, 23);

    const frame = (
      x: number,
      y: number,
      w: number,
      h: number,
      title: string,
    ) => {
      context.fillStyle = '#18231f';
      context.fillRect(x + 6, y + 7, w, h);
      context.fillStyle = '#c5cabf';
      context.fillRect(x, y, w, h);
      context.strokeStyle = '#17221e';
      context.lineWidth = 3;
      context.strokeRect(x, y, w, h);
      context.fillStyle = '#202b26';
      context.fillRect(x + 3, y + 3, w - 6, 29);
      context.fillStyle = '#e9ecdd';
      context.font = '16px monospace';
      context.fillText(title, x + 13, y + 24);
      context.fillStyle = '#f0f0e3';
      context.fillRect(x + 11, y + 44, w - 22, h - 58);
    };
    frame(77, 139, 619, 451, 'about.txt');
    context.fillStyle = '#5b6d60';
    context.font = '16px monospace';
    context.fillText('Hi, I’m Wayne. Also rcyw.', 114, 222);
    context.fillStyle = '#27382f';
    context.font = 'bold 47px sans-serif';
    context.fillText('A small desk.', 110, 303);
    context.fillStyle = '#61765e';
    context.fillText('A lot of questions.', 110, 357);
    context.fillStyle = '#384c3e';
    context.font = '19px sans-serif';
    context.fillText('AI / Agent · Agent Sandbox · AI Infra', 112, 419);
    context.font = '16px monospace';
    context.fillText('There is another layer to explore.', 112, 468);
    context.fillStyle = '#c5cfbd';
    context.fillRect(112, 505, 260, 37);
    context.strokeStyle = '#3e5143';
    context.strokeRect(112, 505, 260, 37);
    context.fillStyle = '#2b4032';
    context.fillText('Open the desk  →', 132, 529);
    frame(725, 220, 222, 226, 'questions.txt');
    context.fillStyle = '#e5dfb6';
    context.fillRect(736, 263, 200, 166);
    context.fillStyle = '#3c4a32';
    context.font = '22px sans-serif';
    context.fillText('What should an', 751, 318);
    context.fillText('agent remember?', 751, 348);
    context.font = '14px monospace';
    context.fillText('Still thinking.', 751, 400);
    context.fillStyle = '#b6c0b1';
    context.fillRect(935, 55, 70, 123);
    context.strokeStyle = '#26372c';
    context.strokeRect(935, 55, 70, 123);
    context.fillStyle = '#283b2f';
    context.font = '16px monospace';
    context.fillText('01', 960, 91);
    context.font = '12px monospace';
    context.fillText('rcyw', 950, 116);
    context.fillRect(949, 137, 42, 25);
    // Subtle phosphor lines are baked into the screen, not a moving shader.
    context.fillStyle = 'rgba(10, 30, 22, 0.05)';
    for (let y = 0; y < 768; y += 3) context.fillRect(0, y, 1024, 1);
  });
}

function deskTexture() {
  let seed = 173;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const map = texture(1024, 1024, (context) => {
    context.fillStyle = '#777563';
    context.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 1600; i++) {
      const y = random() * 1024;
      context.strokeStyle = `rgba(${random() > 0.5 ? '44,47,36' : '191,176,139'},${random() * 0.14})`;
      context.lineWidth = random() * 1.5 + 0.2;
      context.beginPath();
      context.moveTo(0, y);
      context.bezierCurveTo(280, y + random() * 10, 740, y - 4, 1024, y + 2);
      context.stroke();
    }
  });
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 1.6);
  return map;
}

export function buildModels(): WorkbenchModels {
  const root = new THREE.Group();
  const pickables: THREE.Object3D[] = [];
  const highlights = new Map<SceneTarget, THREE.MeshStandardMaterial[]>();
  const dark = material(palette.graphite, 0.52, 0.12);
  const edges = material(palette.edge, 0.58, 0.2);
  const rubber = material(palette.rubber, 0.92);
  const ivory = material(palette.ivory, 0.75);
  const metal = material('#65736b', 0.37, 0.75);
  const mint = material(palette.mint, 0.45, 0.22);

  function interactive(group: THREE.Object3D, target: SceneTarget) {
    const surfaces: THREE.MeshStandardMaterial[] = [];
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.userData.target = target;
        pickables.push(object);
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        for (const surface of materials) {
          // Clone so hovering one object never lights an unrelated shared material.
          if (
            surface instanceof THREE.MeshStandardMaterial &&
            surface.emissive.getHex() === 0
          ) {
            const own = surface.clone();
            object.material = own;
            surfaces.push(own);
          }
        }
      }
    });
    highlights.set(target, [...(highlights.get(target) ?? []), ...surfaces]);
  }

  // A real room gives the desk a horizon, reflected color, and a sense of scale.
  const wall = material('#363f3e', 0.98);
  box(root, [27, 12, 0.25], [0, 4.7, -5.3], wall, 0);
  const windowGroup = new THREE.Group();
  windowGroup.position.set(1.5, 3.1, -5.03);
  root.add(windowGroup);
  box(windowGroup, [6.2, 3.8, 0.16], [0, 0, 0], material('#182723'), 0.02);
  const night = new THREE.MeshStandardMaterial({
    color: '#243c3b',
    emissive: '#203a3d',
    emissiveIntensity: 0.32,
    roughness: 0.36,
  });
  box(windowGroup, [5.92, 3.52, 0.03], [0, 0, 0.1], night, 0);
  const building = material('#152b29', 0.95);
  const cityLight = new THREE.MeshBasicMaterial({ color: '#b6bc98' });
  const cityAmber = new THREE.MeshBasicMaterial({ color: '#b88e56' });
  for (let i = 0; i < 12; i++) {
    const width = 0.28 + ((i * 17) % 5) * 0.07;
    const height = 0.5 + ((i * 13) % 9) * 0.15;
    const x = -2.65 + i * 0.48;
    box(
      windowGroup,
      [width, height, 0.025],
      [x, -1.71 + height / 2, 0.14],
      building,
      0,
    );
    for (let row = 0; row < Math.floor(height / 0.21); row++) {
      if ((row + i) % 3 === 0) continue;
      box(
        windowGroup,
        [0.045, 0.065, 0.006],
        [x - width / 4, -1.59 + row * 0.21, 0.16],
        i % 3 === 0 ? cityAmber : cityLight,
        0,
      );
    }
  }
  box(windowGroup, [0.075, 3.6, 0.12], [-0.95, 0, 0.2], edges, 0);
  box(windowGroup, [0.075, 3.6, 0.12], [1.05, 0, 0.2], edges, 0);
  box(windowGroup, [6, 0.07, 0.12], [0, 0.42, 0.2], edges, 0);
  box(windowGroup, [6.45, 0.12, 0.38], [0, -1.95, 0.1], edges, 0.015);

  const deskSurface = material('#a6a48c', 0.87);
  deskSurface.map = deskTexture();
  box(root, [11.4, 0.25, 6.1], [0, -0.15, 0], deskSurface, 0.065);
  box(root, [11.25, 0.055, 0.045], [0, -0.17, 3.04], metal, 0.008);
  box(root, [10.8, 0.55, 0.15], [0, -0.56, -2.7], dark);
  for (const x of [-4.9, 4.9]) {
    box(root, [0.18, 3.8, 0.45], [x, -2, -1.8], dark);
    box(root, [0.18, 3.8, 0.45], [x, -2, 2.1], dark);
  }
  // A dark felt mat gives the keyboard and modules readable contact shadows.
  box(
    root,
    [7.45, 0.018, 3.32],
    [-0.1, -0.01, 0.45],
    material('#45534c', 1),
    0.08,
  );

  const monitor = new THREE.Group();
  monitor.position.set(-1.25, 0, -0.55);
  root.add(monitor);
  box(monitor, [1.19, 0.09, 0.88], [0, 0.045, 0], dark, 0.045);
  cylinder(monitor, 0.22, 0.36, [0, 0.22, -0.06], edges, 0.15);
  box(monitor, [2.32, 1.93, 1.02], [0, 1.34, -0.06], dark, 0.09);
  box(monitor, [2.12, 1.69, 0.065], [0, 1.39, 0.475], rubber, 0.05);
  const screen = new THREE.Mesh(
    new RoundedBoxGeometry(1.86, 1.395, 0.038, 3, 0.05),
    new THREE.MeshBasicMaterial({ map: desktopTexture(), toneMapped: false }),
  );
  screen.position.set(0, 1.42, 0.518);
  monitor.add(screen);
  label(
    monitor,
    'N e X T',
    0.32,
    0.065,
    [-0.77, 0.479, 0.49],
    '#d4c5a8',
    '#292d2d',
  );
  const screenLed = new THREE.MeshStandardMaterial({
    color: '#b5d3ab',
    emissive: '#b5d3ab',
    emissiveIntensity: 0.8,
  });
  box(monitor, [0.037, 0.018, 0.01], [0.85, 0.495, 0.49], screenLed, 0.004);
  for (let i = 0; i < 14; i++)
    box(
      monitor,
      [0.014, 0.63, 0.15],
      [1.164, 1.53, -0.34 + i * 0.037],
      rubber,
      0.003,
    );
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.05),
    new THREE.MeshBasicMaterial({
      color: '#e6e8ce',
      transparent: true,
      opacity: 0.06,
    }),
  );
  glass.position.set(0, 2.075, 0.54);
  monitor.add(glass);
  interactive(monitor, 'desktop');

  const cube = new THREE.Group();
  cube.position.set(-3.44, 0.64, -0.48);
  root.add(cube);
  box(cube, [1.28, 1.28, 1.28], [0, 0, 0], dark, 0.045);
  for (let i = 0; i < 20; i++) {
    const y = -0.53 + i * 0.053;
    box(cube, [1.22, 0.014, 0.016], [0, y, 0.645], rubber, 0);
    box(cube, [0.016, 0.014, 1.2], [0.645, y, 0], rubber, 0);
  }
  const badge = label(
    cube,
    'NeXT',
    0.29,
    0.085,
    [-0.32, 0.26, 0.657],
    '#d3c496',
  );
  badge.rotation.z = -0.1;
  box(cube, [0.57, 0.035, 0.012], [0.13, -0.23, 0.656], rubber, 0);
  box(cube, [0.017, 0.027, 0.01], [0.45, -0.23, 0.663], screenLed, 0);
  interactive(cube, 'desktop');

  const keyboard = new THREE.Group();
  keyboard.position.set(-1.15, 0, 1.29);
  keyboard.rotation.y = -0.035;
  root.add(keyboard);
  box(keyboard, [2.58, 0.12, 0.91], [0, 0.061, 0], edges, 0.045);
  const keySurface = material('#26332c', 0.78);
  const keyGeometry = new RoundedBoxGeometry(0.143, 0.07, 0.126, 1, 0.009);
  const keys: { x: number; z: number; text: string }[] = [];
  const rows = ['1234567890-=←', 'QWERTYUIOP[]', 'ASDFGHJKL;↵', 'ZXCVBNM,./'];
  for (let row = 0; row < rows.length; row++) {
    [...rows[row]!].forEach((text, column) => {
      const x = -1.13 + column * 0.174 + row * 0.035;
      const z = -0.285 + row * 0.157;
      const key = new THREE.Mesh(keyGeometry, keySurface);
      key.position.set(x, 0.15, z);
      key.castShadow = true;
      keyboard.add(key);
      keys.push({ x, z, text });
    });
  }
  box(keyboard, [0.91, 0.07, 0.126], [-0.13, 0.15, 0.343], keySurface, 0.012);
  for (const x of [-1.1, -0.87, 0.53, 0.77, 1.03])
    box(keyboard, [0.19, 0.07, 0.126], [x, 0.15, 0.343], keySurface, 0.012);
  const keyLabels = texture(1024, 360, (context) => {
    context.fillStyle = '#c0cbbc';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '20px monospace';
    for (const key of keys)
      context.fillText(
        key.text,
        ((key.x + 1.29) / 2.58) * 1024,
        ((key.z + 0.455) / 0.91) * 360,
      );
    context.font = '14px monospace';
    context.fillStyle = '#d2b883';
    context.fillText('command', 90, 319);
    context.fillText('command', 920, 319);
  });
  const legends = new THREE.Mesh(
    new THREE.PlaneGeometry(2.58, 0.91),
    new THREE.MeshBasicMaterial({
      map: keyLabels,
      transparent: true,
      depthWrite: false,
    }),
  );
  legends.rotation.x = -Math.PI / 2;
  legends.position.y = 0.188;
  keyboard.add(legends);
  cable(root, [
    [-2.12, 0.09, 0.85],
    [-2.5, 0.04, 0.45],
    [-2.7, 0.025, -0.9],
    [-2.8, 0.25, -1.1],
  ]);
  cable(
    root,
    [
      [-1.1, 0.05, -1.03],
      [-1.7, 0.04, -1.5],
      [-2.7, 0.03, -1.55],
      [-3.35, 0.4, -1.1],
    ],
    0.021,
  );
  const mouse = new THREE.Group();
  mouse.position.set(0.58, 0.12, 1.42);
  mouse.rotation.y = -0.12;
  root.add(mouse);
  box(mouse, [0.43, 0.23, 0.64], [0, 0, 0], dark, 0.1);
  box(mouse, [0.012, 0.02, 0.25], [0, 0.12, -0.1], rubber, 0);
  cable(root, [
    [0.58, 0.08, 1.1],
    [0.89, 0.04, 0.6],
    [0.78, 0.025, 0.2],
    [0.4, 0.03, -0.5],
    [-0.3, 0.1, -0.95],
  ]);

  const agents = new THREE.Group();
  agents.position.set(1.54, 0, 0.98);
  agents.rotation.y = -0.12;
  root.add(agents);
  box(agents, [1.04, 0.1, 0.88], [0, 0.055, 0], dark);
  const board = material('#3e6b58', 0.56, 0.24);
  box(agents, [0.85, 0.045, 0.68], [0, 0.13, 0], board, 0.01);
  box(agents, [0.4, 0.11, 0.4], [0, 0.2, 0], rubber, 0.012);
  const pins = material('#c7b47d', 0.34, 0.8);
  for (let i = 0; i < 8; i++) {
    const point = -0.158 + i * 0.045;
    for (const side of [-1, 1]) {
      box(
        agents,
        [0.025, 0.025, 0.09],
        [point, 0.177, side * 0.235],
        pins,
        0.002,
      );
      box(
        agents,
        [0.09, 0.025, 0.025],
        [side * 0.235, 0.177, point],
        pins,
        0.002,
      );
    }
  }
  for (let i = 0; i < 3; i++)
    box(
      agents,
      [0.035, 0.025, 0.035],
      [0.31, 0.169, -0.2 + i * 0.13],
      screenLed,
      0.005,
    );
  label(agents, 'AI / AGENT', 0.74, 0.105, [0, 0.056, 0.447]);
  const chipLabel = label(agents, '01', 0.22, 0.08, [0, 0.261, 0]);
  chipLabel.rotation.x = -Math.PI / 2;
  interactive(agents, 'agents');

  const sandbox = new THREE.Group();
  sandbox.position.set(3.1, 0, 0.05);
  sandbox.rotation.y = 0.08;
  root.add(sandbox);
  box(sandbox, [1.24, 0.1, 1.14], [0, 0.055, 0], dark);
  const clear = new THREE.MeshPhysicalMaterial({
    color: '#b3d4c2',
    transparent: true,
    opacity: 0.09,
    roughness: 0.15,
    metalness: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const enclosure = box(
    sandbox,
    [1.02, 1.08, 0.96],
    [0, 0.66, 0],
    clear,
    0.005,
  );
  enclosure.castShadow = false;
  const cage = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.03, 1.08, 0.97)),
    new THREE.LineBasicMaterial({
      color: '#b1c9b7',
      transparent: true,
      opacity: 0.85,
    }),
  );
  cage.position.y = 0.66;
  sandbox.add(cage);
  box(sandbox, [0.36, 0.33, 0.36], [0, 0.28, 0], mint, 0.025);
  box(sandbox, [0.22, 0.025, 0.22], [0, 0.46, 0], dark, 0.01);
  for (const x of [-0.5, 0.5])
    for (const z of [-0.47, 0.47])
      cylinder(sandbox, 0.035, 1.1, [x, 0.67, z], metal);
  label(sandbox, 'SANDBOX', 0.85, 0.11, [0, 0.06, 0.577]);
  interactive(sandbox, 'sandbox');

  const infra = new THREE.Group();
  infra.position.set(1.52, 0, -1.04);
  infra.rotation.y = -0.05;
  root.add(infra);
  box(infra, [1.25, 0.1, 0.94], [0, 0.055, 0], dark);
  for (const x of [-0.55, 0.55]) {
    box(infra, [0.075, 1.29, 0.085], [x, 0.73, 0.39], metal, 0.01);
    box(infra, [0.075, 1.29, 0.085], [x, 0.73, -0.36], metal, 0.01);
  }
  for (let row = 0; row < 3; row++) {
    const y = 0.3 + row * 0.36;
    box(infra, [1.04, 0.27, 0.77], [0, y, 0], edges, 0.018);
    box(infra, [0.89, 0.21, 0.025], [0, y, 0.397], dark, 0.008);
    for (let slot = 0; slot < 5; slot++)
      box(
        infra,
        [0.052, 0.115, 0.012],
        [-0.32 + slot * 0.085, y, 0.414],
        rubber,
        0.002,
      );
    box(
      infra,
      [0.035, 0.035, 0.014],
      [0.28, y + 0.02, 0.418],
      screenLed,
      0.005,
    );
    box(
      infra,
      [0.018, 0.035, 0.014],
      [0.35, y + 0.02, 0.418],
      material('#c8ae74'),
      0.003,
    );
    for (const x of [-0.5, 0.5])
      box(infra, [0.04, 0.08, 0.04], [x, y, 0.43], metal, 0.005);
  }
  label(infra, 'AI INFRA', 0.8, 0.11, [0, 0.06, 0.48]);
  cable(
    infra,
    [
      [0.4, 0.3, -0.4],
      [0.7, 0.23, -0.52],
      [0.63, 0.6, -0.6],
      [0.35, 0.93, -0.4],
    ],
    0.012,
  );
  interactive(infra, 'infra');

  const notes = new THREE.Group();
  notes.position.set(3.03, 0.03, 1.91);
  notes.rotation.y = -0.17;
  root.add(notes);
  box(notes, [1.25, 0.035, 1.03], [0, 0, 0], material('#2f3b32'), 0.025);
  box(notes, [1.12, 0.012, 0.89], [0, 0.027, 0.01], ivory, 0.004);
  const noteMap = texture(768, 600, (context) => {
    context.fillStyle = '#e7e4c7';
    context.fillRect(0, 0, 768, 600);
    context.fillStyle = '#59705a';
    context.font = '22px monospace';
    context.fillText('QUESTIONS / 01', 55, 80);
    context.fillStyle = '#354d39';
    context.font = '38px sans-serif';
    context.fillText('What should an', 55, 200);
    context.fillText('agent remember?', 55, 250);
    context.strokeStyle = '#a5b19a';
    context.lineWidth = 2;
    for (let y = 350; y < 520; y += 47) {
      context.beginPath();
      context.moveTo(55, y);
      context.lineTo(700, y);
      context.stroke();
    }
    context.font = '21px monospace';
    context.fillText('Still thinking.  — rcyw', 55, 556);
  });
  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.87),
    new THREE.MeshBasicMaterial({ map: noteMap, toneMapped: false }),
  );
  paper.rotation.x = -Math.PI / 2;
  paper.position.set(0, 0.035, 0.01);
  notes.add(paper);
  box(notes, [0.35, 0.055, 0.1], [0, 0.056, -0.43], metal, 0.015);
  interactive(notes, 'notes');
  // A graphite pencil and an off-center coffee ring add lived-in scale without props as links.
  const pencil = cylinder(
    root,
    0.018,
    0.94,
    [2.12, 0.04, 2.13],
    material('#b49b6d'),
    0.018,
  );
  pencil.rotation.z = Math.PI / 2;
  pencil.rotation.y = -0.22;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.26, 0.277, 48),
    new THREE.MeshBasicMaterial({
      color: '#5b604e',
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(-3.91, -0.018, 1.58);
  root.add(ring);

  const lamp = new THREE.Group();
  lamp.position.set(-4.02, 0, -1.81);
  root.add(lamp);
  cylinder(lamp, 0.37, 0.09, [0, 0.05, 0], dark);
  cylinder(lamp, 0.032, 1.64, [0, 0.9, 0], metal);
  const arm = cylinder(lamp, 0.032, 1.13, [0.44, 1.96, 0], metal);
  arm.rotation.z = -0.91;
  cylinder(lamp, 0.081, 0.07, [0, 1.73, 0], dark).rotation.x = Math.PI / 2;
  cylinder(lamp, 0.081, 0.07, [0.89, 2.23, 0], dark).rotation.x = Math.PI / 2;
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.42, 0.33, 48, 1, true),
    new THREE.MeshStandardMaterial({
      color: '#b9bd9e',
      roughness: 0.44,
      metalness: 0.38,
      side: THREE.DoubleSide,
    }),
  );
  shade.position.set(0.89, 2.15, 0);
  shade.castShadow = true;
  lamp.add(shade);
  const bulbSurface = new THREE.MeshStandardMaterial({
    color: '#f4dcac',
    emissive: '#ffcb75',
    emissiveIntensity: 1.5,
  });
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 16, 12),
    bulbSurface,
  );
  bulb.position.set(0.89, 2.07, 0);
  lamp.add(bulb);
  const lampLight = new THREE.SpotLight(
    '#ffda9b',
    34,
    9,
    Math.PI / 3.15,
    0.75,
    1.7,
  );
  lampLight.position.set(-3.13, 2.03, -1.81);
  lampLight.target.position.set(-1.8, 0, 0.3);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(1024, 1024);
  lampLight.shadow.bias = -0.0007;
  lampLight.shadow.normalBias = 0.025;
  root.add(lampLight, lampLight.target);
  box(lamp, [0.095, 0.04, 0.09], [0.16, 0.115, 0.12], rubber, 0.015);
  cable(root, [
    [-4.1, 0.03, -1.86],
    [-4.7, 0.02, -2.1],
    [-4.5, 0.01, -2.8],
    [-4.4, -0.6, -3.05],
  ]);
  interactive(lamp, 'lamp');

  const hemisphere = new THREE.HemisphereLight('#bed4cd', '#514634', 1.9);
  const key = new THREE.DirectionalLight('#d7e3d3', 2.15);
  key.position.set(1.5, 7, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 20;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  key.shadow.radius = 3;
  const cool = new THREE.PointLight('#96bec5', 14, 14, 2);
  cool.position.set(3.5, 3, -3.1);
  const screenLight = new THREE.PointLight('#b4d6bb', 0.9, 3, 1.8);
  screenLight.position.set(-1.25, 1.45, 0.3);
  root.add(hemisphere, key, cool, screenLight);

  return {
    root,
    pickables,
    screenCenter: new THREE.Vector3(-1.25, 1.42, -0.01),
    setLamp(on) {
      lampLight.intensity = on ? 34 : 0;
      bulbSurface.emissiveIntensity = on ? 1.5 : 0;
      bulbSurface.color.set(on ? '#f4dcac' : '#8c8c74');
    },
    setHighlight(target) {
      for (const [name, surfaces] of highlights)
        for (const surface of surfaces) {
          if (surface === bulbSurface || surface === screenLed) continue;
          surface.emissive.set(name === target ? '#92bea6' : '#000000');
          surface.emissiveIntensity = name === target ? 0.13 : 0;
        }
    },
  };
}
